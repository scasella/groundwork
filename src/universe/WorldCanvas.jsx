import { useEffect, useId, useRef, useState } from 'react'
import { CELL_COLORS, CELL_NAMES, FIELD_SIZE, SIZE } from './engine.js'
import './world.css'

const PIXEL = 8
const PAINT = { erase: 0, sand: 1, water: 2, stone: 3 }
const DIRECTIONS = ['down', 'left', 'up', 'right']
const ARROWS = [[0, 1], [-1, 0], [0, -1], [1, 0]]
const clamp = (value, low, high) => Math.max(low, Math.min(high, value))
const color = (cell) => CELL_COLORS[cell] || '#0a1625'

function strokeCells(from, to, brushSize) {
  const indices = new Set()
  const size = clamp(Math.round(brushSize) || 1, 1, 16)
  const offset = Math.floor(size / 2)
  const steps = Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y), 1)
  for (let step = 0; step <= steps; step++) {
    const x = Math.round(from.x + (to.x - from.x) * step / steps)
    const y = Math.round(from.y + (to.y - from.y) * step / steps)
    for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) {
      const px = x + dx - offset, py = y + dy - offset
      if (px >= 0 && px < SIZE && py >= 0 && py < SIZE) indices.add(py * SIZE + px)
    }
  }
  return [...indices]
}

export function WorldCanvas({ world, field, label, mode = 'inspect', direction = 0,
  brushSize = 2, showField = false, disabled = false, onPaint, onFieldPaint,
  onCapture, onEditStart, onEditEnd, highlight = [] }) {
  const canvasRef = useRef(null)
  const gesture = useRef(null)
  const endRef = useRef(onEditEnd)
  endRef.current = onEditEnd
  const [cursor, setCursor] = useState({ x: Math.floor(SIZE / 2), y: Math.floor(SIZE / 2) })
  const [focused, setFocused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [notice, setNotice] = useState('')
  const helpId = useId()
  const statusId = useId()
  const title = label || 'Your world'

  function endGesture() {
    if (!gesture.current) return
    const pointerId = gesture.current.pointerId
    gesture.current = null
    if (canvasRef.current?.hasPointerCapture?.(pointerId)) canvasRef.current.releasePointerCapture(pointerId)
    endRef.current?.()
  }

  useEffect(() => () => {
    if (gesture.current) { gesture.current = null; endRef.current?.() }
  }, [])

  useEffect(() => {
    if (disabled) endGesture()
  }, [disabled])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false
    ctx.fillStyle = '#0a1625'
    ctx.fillRect(0, 0, SIZE * PIXEL, SIZE * PIXEL)
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const value = world?.[y * SIZE + x] ?? 0
      if (!value) continue
      ctx.fillStyle = color(value)
      ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL)
      // Surface facets belong to actual occupied cells, never synthetic particles.
      ctx.fillStyle = value === 2 ? '#ffffff20' : '#ffffff15'
      ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, 1)
    }
    if (showField || mode === 'field') {
      const tile = SIZE * PIXEL / FIELD_SIZE
      for (let y = 0; y < FIELD_SIZE; y++) for (let x = 0; x < FIELD_SIZE; x++) {
        const dir = field?.[y * FIELD_SIZE + x] ?? 0
        const [dx, dy] = ARROWS[dir] || ARROWS[0]
        const cx = (x + .5) * tile, cy = (y + .5) * tile, length = tile * .2
        ctx.strokeStyle = '#c4e9f31c'; ctx.lineWidth = 1
        ctx.strokeRect(x * tile + .5, y * tile + .5, tile, tile)
        ctx.beginPath()
        ctx.moveTo(cx - dx * length, cy - dy * length)
        ctx.lineTo(cx + dx * length, cy + dy * length)
        ctx.moveTo(cx + dx * length - dx * 6 - dy * 6, cy + dy * length - dy * 6 + dx * 6)
        ctx.lineTo(cx + dx * length, cy + dy * length)
        ctx.lineTo(cx + dx * length - dx * 6 + dy * 6, cy + dy * length - dy * 6 - dx * 6)
        ctx.strokeStyle = '#081420'; ctx.lineWidth = 5; ctx.stroke()
        ctx.strokeStyle = '#c8f6e9'; ctx.lineWidth = 2; ctx.stroke()
      }
    }
    ctx.strokeStyle = '#f8eee0'; ctx.lineWidth = 2
    for (const index of highlight) {
      if (!Number.isInteger(index) || index < 0 || index >= SIZE * SIZE) continue
      ctx.strokeRect(index % SIZE * PIXEL + 1, Math.floor(index / SIZE) * PIXEL + 1, PIXEL - 2, PIXEL - 2)
    }
    if (focused || hovered) {
      const fieldMode = mode === 'field'
      const extent = fieldMode ? SIZE / FIELD_SIZE : 1
      const x = fieldMode ? Math.floor(cursor.x / extent) * extent : cursor.x
      const y = fieldMode ? Math.floor(cursor.y / extent) * extent : cursor.y
      ctx.strokeStyle = '#07121f'; ctx.lineWidth = 4
      ctx.strokeRect(x * PIXEL + 1, y * PIXEL + 1, extent * PIXEL - 2, extent * PIXEL - 2)
      ctx.strokeStyle = disabled ? '#a0a9b1' : '#ffffff'; ctx.lineWidth = 2
      ctx.strokeRect(x * PIXEL + 1, y * PIXEL + 1, extent * PIXEL - 2, extent * PIXEL - 2)
    }
  }, [world, field, showField, mode, highlight, cursor, focused, hovered, disabled])

  function coordinate(event) {
    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: clamp(Math.floor((event.clientX - rect.left) / Math.max(rect.width, 1) * SIZE), 0, SIZE - 1),
      y: clamp(Math.floor((event.clientY - rect.top) / Math.max(rect.height, 1) * SIZE), 0, SIZE - 1),
    }
  }

  function apply(from, to) {
    if (mode === 'inspect') {
      onCapture?.(to.x, to.y)
      setNotice(`Captured the patch at column ${to.x + 1}, row ${to.y + 1}.`)
    } else if (mode === 'field') {
      const indices = new Set(strokeCells(from, to, 1).map((index) =>
        Math.floor(Math.floor(index / SIZE) / (SIZE / FIELD_SIZE)) * FIELD_SIZE +
        Math.floor((index % SIZE) / (SIZE / FIELD_SIZE))))
      onFieldPaint?.([...indices], direction)
      setNotice(`Field painted ${DIRECTIONS[direction] || 'down'}.`)
    } else if (Object.hasOwn(PAINT, mode)) {
      onPaint?.(strokeCells(from, to, brushSize), PAINT[mode])
      setNotice(mode === 'erase' ? 'Cells erased.' : `${CELL_NAMES[PAINT[mode]]} painted.`)
    }
  }

  function pointerDown(event) {
    if (disabled || event.button !== 0 || gesture.current) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    const point = coordinate(event)
    setCursor(point)
    gesture.current = { pointerId: event.pointerId, last: point, mode }
    event.currentTarget.setPointerCapture?.(event.pointerId)
    onEditStart?.()
    apply(point, point)
  }

  function pointerMove(event) {
    const point = coordinate(event)
    if (!gesture.current || gesture.current.pointerId === event.pointerId) setCursor(point)
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId || disabled) return
    if (active.mode !== mode) { endGesture(); return }
    if (mode !== 'inspect') apply(active.last, point)
    active.last = point
  }

  function keyDown(event) {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const distance = event.shiftKey ? SIZE / FIELD_SIZE : 1
    const delta = { ArrowLeft: [-distance, 0], ArrowRight: [distance, 0], ArrowUp: [0, -distance], ArrowDown: [0, distance] }[event.key]
    if (delta) {
      event.preventDefault()
      moveCursor(clamp(cursor.x + delta[0], 0, SIZE - 1), clamp(cursor.y + delta[1], 0, SIZE - 1))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      moveCursor(event.key === 'Home' ? 0 : SIZE - 1, cursor.y)
    } else if (event.key === 'Escape') {
      endGesture()
    } else if ((event.key === 'Enter' || event.key === ' ') && !disabled && !event.repeat) {
      event.preventDefault()
      onEditStart?.()
      try { apply(cursor, cursor) } finally { onEditEnd?.() }
    } else if (event.key === ' ') event.preventDefault()
  }

  function moveCursor(x, y) {
    setCursor({ x, y })
    const material = CELL_NAMES[world?.[y * SIZE + x] ?? 0] || 'Empty'
    setNotice(`Column ${x + 1}, row ${y + 1}: ${material}.`)
  }

  const cell = world?.[cursor.y * SIZE + cursor.x] ?? 0
  const instruction = mode === 'inspect' ? 'Select a patch' : mode === 'field' ? `Paint direction: ${DIRECTIONS[direction]}` : mode === 'erase' ? 'Erase cells' : `Pour ${mode}`

  return <figure className="gw-world">
    <div className="gw-world-frame">
      <canvas ref={canvasRef} width={SIZE * PIXEL} height={SIZE * PIXEL}
        role="group" tabIndex={0} aria-label={`${title}. Interactive ${SIZE} by ${SIZE} world. ${instruction}.`}
        aria-describedby={`${helpId} ${statusId}`} aria-disabled={disabled}
        className={`gw-world-canvas${disabled ? ' is-disabled' : ''}`}
        onFocus={() => setFocused(true)} onBlur={() => { setFocused(false); endGesture() }}
        onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
        onPointerDown={pointerDown} onPointerMove={pointerMove}
        onPointerUp={(event) => { if (gesture.current?.pointerId === event.pointerId) endGesture() }}
        onPointerCancel={(event) => { if (gesture.current?.pointerId === event.pointerId) endGesture() }}
        onLostPointerCapture={(event) => { if (gesture.current?.pointerId === event.pointerId) endGesture() }}
        onKeyDown={keyDown}>
        {title}: a {SIZE} by {SIZE} world of sand, water, stone, and empty cells.
      </canvas>
    </div>
    <figcaption className="gw-world-caption">
      <span className="gw-world-action">{disabled ? 'Viewing world' : instruction}</span>
      <span id={statusId}>Column {cursor.x + 1} · row {cursor.y + 1} · {CELL_NAMES[cell] || 'Empty'}</span>
    </figcaption>
    <p className="gw-world-key-help" id={helpId}>Arrow keys move. Shift moves 8 cells. Enter or Space {mode === 'inspect' ? 'selects a patch' : 'paints'}. Board edges wrap during simulation.</p>
    <span className="gw-world-sr" role="status">{notice}</span>
  </figure>
}

export function CellPatch({ cells, label, onCellClick, selected = -1, annotations = [] }) {
  return <div className="gw-cell-patch" role="group" aria-label={label || 'Four-cell patch'}>
    {Array.from({ length: 4 }, (_, index) => {
      const cell = cells?.[index] ?? -1
      const name = cell === -1 ? 'Any material' : CELL_NAMES[cell] || 'Unknown material'
      const annotation = annotations[index]
      const props = {
        className: `gw-patch-cell${selected === index ? ' is-selected' : ''}${cell === -1 ? ' is-any' : ''}`,
        style: { '--gw-cell-color': cell === -1 ? '#243449' : color(cell) },
        'aria-label': `${index < 2 ? 'Top' : 'Bottom'} ${index % 2 ? 'right' : 'left'}: ${name}${annotation ? `, ${annotation}` : ''}`,
      }
      const content = <><span className="gw-cell-material">{cell === -1 ? 'Any' : name}</span>{annotation !== undefined && annotation !== '' && <span className="gw-cell-annotation">{annotation}</span>}</>
      return onCellClick
        ? <button key={index} type="button" {...props} aria-pressed={selected === index} onClick={() => onCellClick(index)}>{content}</button>
        : <div key={index} {...props}>{content}</div>
    })}
  </div>
}
