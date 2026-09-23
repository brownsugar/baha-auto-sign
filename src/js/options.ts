import {
  configLocalPrefix,
  defConfig,
  defConfigLocal,
  getConfig,
  getConfigLocal,
} from './lib/config'
import { setStorageData } from './lib/storage'

const ITEM_H = 36
const PERIODS = ['上午', '下午']
// 無限循環：時／分欄內容重複多組，滾到外組時無縫跳回中組（內容完全相同，視覺不斷層）
// 時段欄只有上午下午兩個，不重複，捲動即來回切換
const HOUR_SET = 24, HOUR_REPS = 5, HOUR_MID = 2
const MIN_SET = 60, MIN_REPS = 5, MIN_MID = 2
const pad2 = (n: number) => String(n).padStart(2, '0')
const parseTime = (v: string): { h: number; m: number } => {
  const m = /^(\d{1,2}):(\d{1,2})/.exec(v.trim())
  if (!m) return { h: 0, m: 6 }
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10) || 0))
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10) || 0))
  return { h, m: min }
}

type RollerKind = 'period' | 'hour' | 'min'

(async () => {
  const camelize = (s: string) =>
    s.replace(new RegExp(`^${configLocalPrefix}`), '')
      .replace(/-./g, x => x[1].toUpperCase())

  const $ = <T extends HTMLElement>(sel: string) =>
    document.querySelector(sel) as T | null

  // ---------- Toast（輕量儲存提示） ----------
  const toastEl = $('#toast') as HTMLDivElement | null
  let toastTimer = 0
  const showToast = (msg: string) => {
    if (!toastEl) return
    toastEl.textContent = msg
    toastEl.classList.add('show')
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => toastEl.classList.remove('show'), 1600)
  }
  let toastDebounce = 0
  const toastSaved = (msg: string) => {
    window.clearTimeout(toastDebounce)
    toastDebounce = window.setTimeout(() => showToast(msg), 450)
  }

  // ---------- 時間狀態（三欄共用，儲存維持 24h "HH:MM"） ----------
  // 時欄固定顯示完整連續 00~23（11 下一格就是 12），時段欄只跟隨＋粗跳
  const periodList = $('#roller-period') as HTMLDivElement | null
  const hourList = $('#roller-hour') as HTMLDivElement | null
  const minList = $('#roller-min') as HTMLDivElement | null
  const triggerText = $('#time-trigger-text')
  const hiddenTime = $('#launch-time') as HTMLInputElement | null
  const nextRunHint = $('#next-run-hint')
  const warnEl = $('#midnight-warn')
  const panelWrap = $('#time-panel-wrap')
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('.chip[data-time]'))

  let hour = 0 // 0~23
  let min = 6
  let silent = false // 初始化同步時不觸發儲存
  // 各欄上次讀到的列索引（增量計算用）＋程式觸發捲動旗標
  const prevIdx: Record<RollerKind, number> = { period: 0, hour: 0, min: 0 }
  const prog: Record<RollerKind, boolean> = { period: false, hour: false, min: false }

  const periodOf = () => (hour >= 12 ? 1 : 0)
  const timeStr = () => `${pad2(hour)}:${pad2(min)}`
  const recCfg = (kind: RollerKind) => kind === 'hour'
    ? { set: HOUR_SET, mid: HOUR_MID }
    : { set: MIN_SET, mid: MIN_MID }
  const midTop = (kind: RollerKind) => {
    const c = recCfg(kind)
    return c.set * c.mid
  }
  const listOf = (kind: RollerKind) =>
    kind === 'period' ? periodList : kind === 'hour' ? hourList : minList
  const curValueOf = (kind: RollerKind) =>
    kind === 'period' ? periodOf() : kind === 'hour' ? hour : min
  // 值 → 列索引（時段欄不重複，直接 0/1；時分欄指向中組）
  const valueToIndex = (kind: RollerKind, v: number) =>
    kind === 'period' ? v
      : kind === 'hour' ? midTop(kind) + v
        : midTop(kind) + v

  const makeItem = (list: HTMLDivElement, kind: RollerKind, value: number, label: string) => {
    const d = document.createElement('div')
    d.className = 'roller-item'
    d.textContent = label
    d.dataset.value = String(value)
    d.setAttribute('role', 'option')
    d.addEventListener('click', () => {
      // 點已選中的數字 → 直接輸入；點別的 → 捲到該列
      if (kind !== 'period' && value === curValueOf(kind)) {
        startEdit(list, kind, d)
      } else {
        scrollToValue(kind, value, true)
      }
    })
    list.appendChild(d)
  }
  const addSpacer = (list: HTMLDivElement) => {
    const s = document.createElement('div')
    s.style.height = `${ITEM_H}px`
    s.setAttribute('aria-hidden', 'true')
    list.appendChild(s)
  }

  const buildStaticRoller = (list: HTMLDivElement, kind: 'period' | 'min') => {
    addSpacer(list)
    if (kind === 'period') {
      PERIODS.forEach((label, i) => makeItem(list, kind, i, label))
    } else {
      for (let r = 0; r < MIN_REPS; r++) {
        for (let i = 0; i <= 59; i++) makeItem(list, kind, i, pad2(i))
      }
    }
    addSpacer(list)
  }

  const buildHourRoller = () => {
    if (!hourList) return
    hourList.innerHTML = ''
    addSpacer(hourList)
    for (let r = 0; r < HOUR_REPS; r++) {
      for (let v = 0; v <= 23; v++) makeItem(hourList, 'hour', v, pad2(v))
    }
    addSpacer(hourList)
  }

  const markActive = () => {
    periodList?.querySelectorAll('.roller-item').forEach(el => {
      const on = Number((el as HTMLElement).dataset.value) === periodOf()
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    hourList?.querySelectorAll('.roller-item').forEach(el => {
      const on = Number((el as HTMLElement).dataset.value) === hour
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    minList?.querySelectorAll('.roller-item').forEach(el => {
      const on = Number((el as HTMLElement).dataset.value) === min
      el.classList.toggle('is-active', on)
      el.setAttribute('aria-selected', on ? 'true' : 'false')
    })
    chips.forEach(c => {
      c.classList.toggle('is-current', c.dataset.time === timeStr())
    })
  }

  const updateCountdown = () => {
    if (nextRunHint) {
      const now = new Date()
      const next = new Date(now)
      next.setHours(hour, min, 0, 0)
      let label = '今天'
      if (next.getTime() <= now.getTime()) {
        next.setDate(next.getDate() + 1)
        label = '明天'
      }
      const diff = next.getTime() - now.getTime()
      const dh = Math.floor(diff / 3600000)
      const dm = Math.round((diff % 3600000) / 60000)
      nextRunHint.textContent = `${label}還有 ${dh}h ${pad2(dm)}m`
    }
    if (warnEl) {
      const risky = hour === 0 && min <= 2
      warnEl.classList.toggle('is-alert', risky)
      warnEl.innerHTML = risky
        ? '目前落在 <b>0 點整前後</b>，容易有時間差簽到失敗，建議改 00:06 之後。（點此改為 06:00）'
        : '不建議設定剛好 0 點，避免產生時間差問題。'
    }
  }

  const render = () => {
    if (triggerText) triggerText.textContent = timeStr()
    markActive()
    updateCountdown()
  }

  const commit = (h: number, m: number) => {
    const p0 = periodOf()
    hour = ((h % 24) + 24) % 24
    min = ((m % 60) + 60) % 60
    render()
    // 時段翻轉時把時段欄捲到對應位置（跟隨）
    if (periodOf() !== p0) scrollToValue('period', periodOf())
    if (silent || !hiddenTime) return
    const v = timeStr()
    if (hiddenTime.value !== v) {
      hiddenTime.value = v
      hiddenTime.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }

  const snapTimers: Record<RollerKind, number> = { period: 0, hour: 0, min: 0 }
  const scrollToValue = (kind: RollerKind, v: number, smooth = false) => {
    const list = listOf(kind)
    if (!list) return
    const idx = valueToIndex(kind, v)
    if (smooth) {
      // 平滑捲動中間過程忽略，只認程式目標（由呼叫前 commit 寫入的值為準）
      // 且暫關 snap，避免中途被吸附造成彈跳，停穩後恢復
      prog[kind] = true
      list.style.scrollSnapType = 'none'
      window.clearTimeout(snapTimers[kind])
      snapTimers[kind] = window.setTimeout(() => { list.style.scrollSnapType = '' }, 350)
      list.scrollTo({ top: idx * ITEM_H, behavior: 'smooth' })
    } else {
      prevIdx[kind] = idx
      list.scrollTop = idx * ITEM_H
    }
  }

  // 滾到外組時無縫跳回中組（內容重複，視覺不斷層；時段欄不重複，直接回傳）
  const recenter = (kind: RollerKind, list: HTMLDivElement, idx: number) => {
    if (kind === 'period') return idx
    const c = recCfg(kind)
    const low = c.set * (c.mid - 1)
    const high = c.set * (c.mid + 1)
    const jump = c.set * 2
    if (idx < low) {
      list.scrollTop += jump * ITEM_H
      prevIdx[kind] += jump
      return idx + jump
    }
    if (idx >= high) {
      list.scrollTop -= jump * ITEM_H
      prevIdx[kind] -= jump
      return idx - jump
    }
    return idx
  }

  // ---------- 數字點擊直接輸入（不合法自行忽略） ----------
  const startEdit = (list: HTMLDivElement, kind: RollerKind, itemEl: HTMLDivElement) => {
    if (itemEl.querySelector('input')) return
    const label = itemEl.textContent || ''
    itemEl.textContent = ''
    const input = document.createElement('input')
    input.className = 'roller-edit'
    input.value = label
    input.maxLength = 2
    input.inputMode = 'numeric'
    input.setAttribute('aria-label', kind === 'hour' ? '直接輸入小時' : '直接輸入分鐘')
    itemEl.appendChild(input)
    input.focus()
    input.select()
    let done = false
    const finish = (ok: boolean) => {
      if (done) return
      done = true
      const raw = input.value.trim()
      input.remove()
      itemEl.textContent = label // 先還原，再由 render 重標
      if (!ok) {
        render()
        return
      }
      if (!/^\d{1,2}$/.test(raw)) {
        render() // 不合法就忽略
        return
      }
      const n = parseInt(raw, 10)
      if (kind === 'hour') {
        if (n < 0 || n > 24) {
          render() // 不是 0~24 就忽略
          return
        }
        const h = n % 24 // 24 → 00，落在另一時段就自動翻轉
        commit(h, min)
        scrollToValue('period', h >= 12 ? 1 : 0, true)
        scrollToValue('hour', h, true)
      } else {
        if (n < 0 || n > 59) {
          render()
          return
        }
        commit(hour, n)
        scrollToValue('min', n, true)
      }
    }
    input.addEventListener('keydown', e => {
      e.stopPropagation()
      if (e.key === 'Enter') finish(true)
      else if (e.key === 'Escape') finish(false)
    })
    input.addEventListener('blur', () => finish(true))
    input.addEventListener('click', e => e.stopPropagation())
    input.addEventListener('pointerdown', e => e.stopPropagation())
    list.addEventListener('scroll', () => {
      if (!done) finish(false)
    }, { once: true })
  }

  // 滑鼠滾輪：一下一格（攔截原生捲動，避免一次跳多格；觸控拖曳不受影響）
  // 一步一格用瞬移：數值與格子永遠同步，不會有highlight先飛、格子慢慢追的脫節感
  let wheelAcc = 0
  let wheelCoolUntil = 0
  const stepBy = (kind: RollerKind, dir: 1 | -1) => {
    if (kind === 'period') {
      const np = periodOf() === 0 ? 1 : 0
      commit((hour % 12) + np * 12, min)
      scrollToValue('period', np)
    } else if (kind === 'hour') {
      commit(hour + dir, min)
      scrollToValue('hour', hour)
    } else {
      const total = hour * 60 + min + dir
      const h = ((Math.floor(total / 60) % 24) + 24) % 24
      const m = ((total % 60) + 60) % 60
      commit(h, m)
      scrollToValue('hour', h)
      scrollToValue('min', m)
    }
  }

  const bindRollerScroll = (list: HTMLDivElement, kind: RollerKind) => {
    let raf = 0
    let dragY: number | null = null
    let dragged = false
    // 使用者手勢 → 之後的捲動事件視為手動
    const markManual = () => { prog[kind] = false }
    list.addEventListener('pointerdown', markManual)
    list.addEventListener('keydown', markManual)
    list.addEventListener('wheel', e => {
      e.preventDefault()
      prog[kind] = false
      let dy = e.deltaY
      if (e.deltaMode === 1) dy *= 36
      else if (e.deltaMode === 2) dy *= 400
      const now = performance.now()
      if (now < wheelCoolUntil) return
      wheelAcc += dy
      if (Math.abs(wheelAcc) >= 24) {
        stepBy(kind, wheelAcc > 0 ? 1 : -1)
        wheelAcc = 0
        wheelCoolUntil = now + 90
      }
    }, { passive: false })
    list.addEventListener('scroll', () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        let idx = Math.round(list.scrollTop / ITEM_H)
        idx = recenter(kind, list, idx)
        const didx = idx - prevIdx[kind]
        prevIdx[kind] = idx
        if (prog[kind] || didx === 0) {
          render()
          return
        }
        // 增量套用，跨欄自動進位／借位
        if (kind === 'period') {
          const np = (((periodOf() + didx) % 2) + 2) % 2
          commit((hour % 12) + np * 12, min)
        } else if (kind === 'hour') {
          commit(hour + didx, min)
        } else {
          const total = hour * 60 + min + didx
          const h = ((Math.floor(total / 60) % 24) + 24) % 24
          const m = ((total % 60) + 60) % 60
          commit(h, m)
          // 進位改變了時 → 把時欄捲到對應位置
          scrollToValue('hour', h)
        }
      })
    }, { passive: true })
    // 滑鼠拖曳捲動（增量式；不可 setPointerCapture 會吃掉 click）
    list.addEventListener('pointerdown', e => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      dragY = e.clientY
      dragged = false
    })
    list.addEventListener('pointermove', e => {
      if (dragY === null) return
      const dy = e.clientY - dragY
      if (Math.abs(dy) > 6) dragged = true
      list.scrollTop -= dy
      dragY = e.clientY
    })
    const endDrag = () => {
      dragY = null
      window.setTimeout(() => { dragged = false }, 0)
    }
    list.addEventListener('pointerup', endDrag)
    list.addEventListener('pointercancel', endDrag)
    list.addEventListener('click', e => {
      if (dragged) {
        e.stopPropagation()
        e.preventDefault()
      }
    }, true)
    list.addEventListener('keydown', e => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      const d = e.key === 'ArrowUp' ? -1 : 1
      if (kind === 'period') {
        commit((hour % 12) + (periodOf() === 0 ? 12 : 0), min)
        scrollToValue('period', periodOf())
      } else if (kind === 'hour') {
        commit(hour + d, min)
        scrollToValue('hour', hour)
      } else {
        const total = hour * 60 + min + d
        const h = ((Math.floor(total / 60) % 24) + 24) % 24
        const m = ((total % 60) + 60) % 60
        commit(h, m)
        scrollToValue('hour', h)
        scrollToValue('min', m)
      }
    })
  }

  if (periodList && hourList && minList) {
    buildStaticRoller(periodList, 'period')
    buildHourRoller()
    buildStaticRoller(minList, 'min')
    bindRollerScroll(periodList, 'period')
    bindRollerScroll(hourList, 'hour')
    bindRollerScroll(minList, 'min')
  }

  chips.forEach(c => {
    c.addEventListener('click', () => {
      const t = parseTime(c.dataset.time || '00:06')
      commit(t.h, t.m)
      scrollToValue('period', t.h >= 12 ? 1 : 0, true)
      scrollToValue('hour', t.h, true)
      scrollToValue('min', t.m, true)
    })
  })

  // 提示字可點：警告時點一下自動跳 06:00
  warnEl?.addEventListener('click', () => {
    if (!warnEl.classList.contains('is-alert')) return
    commit(6, 0)
    scrollToValue('period', 0, true)
    scrollToValue('hour', 6, true)
    scrollToValue('min', 0, true)
  })

  // ---------- 密碼檢視眼睛 ----------
  const pwInput = $('#local-login-password') as HTMLInputElement | null
  const pwToggle = $('#pw-toggle') as HTMLButtonElement | null
  pwToggle?.addEventListener('click', () => {
    if (!pwInput) return
    const show = pwInput.type === 'password'
    pwInput.type = show ? 'text' : 'password'
    pwToggle.setAttribute('aria-pressed', show ? 'true' : 'false')
    pwToggle.setAttribute('aria-label', show ? '隱藏密碼' : '顯示密碼')
    const eyeOn = pwToggle.querySelector('.eye-on') as SVGElement | null
    const eyeOff = pwToggle.querySelector('.eye-off') as SVGElement | null
    if (eyeOn) eyeOn.style.display = show ? 'none' : ''
    if (eyeOff) eyeOff.style.display = show ? '' : 'none'
  })

  // ---------- 說明文字：點 ! 或點標題延展（連動） ----------
  document.querySelectorAll<HTMLButtonElement>('.info-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target || '')
      const open = target?.classList.toggle('open') ?? false
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
      btn.setAttribute('aria-label', open ? '隱藏說明' : '顯示說明')
    })
  })
  document.querySelectorAll('legend').forEach(lg => {
    const btn = lg.querySelector<HTMLButtonElement>('.info-btn')
    if (!btn) return // 沒有說明的不連動（如防打擾）
    btn.addEventListener('click', e => e.stopPropagation()) // 避免冒泡讓標題再觸發一次
    lg.addEventListener('click', e => {
      if ((e.target as HTMLElement).closest('.info-btn')) return
      btn.click()
    })
  })

  // ---------- 點擊展開/收合（比照下拉選單動畫） ----------
  const trigger = $('#time-trigger') as HTMLButtonElement | null
  const panelWrapEl = panelWrap
  const setOpen = (open: boolean) => {
    panelWrapEl?.classList.toggle('open', open)
    trigger?.setAttribute('aria-expanded', open ? 'true' : 'false')
  }
  trigger?.addEventListener('click', e => {
    e.stopPropagation()
    setOpen(!panelWrapEl?.classList.contains('open'))
  })
  document.addEventListener('click', e => {
    if (panelWrapEl?.classList.contains('open') && !panelWrapEl.contains(e.target as Node)) {
      setOpen(false)
    }
  })

  // ---------- Init form data（原邏輯不變） ----------
  const config = await getConfig()
  const configLocal = await getConfigLocal()

  document.querySelectorAll('form input').forEach((el: HTMLInputElement) => {
    const id = el.id
    const isLocal = id.startsWith(configLocalPrefix)
    const key = camelize(id)

    const baseConfig = isLocal ? configLocal : config
    if (key in baseConfig) {
      const type = el.type
      if (type === 'checkbox')
        el.checked = baseConfig[key]
      else
        el.value = baseConfig[key]
    }
  })

  // 同步錶盤到已儲存時間（不觸發儲存）
  silent = true
  const initT = parseTime(hiddenTime?.value || config.launchTime || '00:06')
  hour = initT.h
  min = initT.m
  prevIdx.period = valueToIndex('period', periodOf())
  prevIdx.hour = valueToIndex('hour', hour)
  prevIdx.min = valueToIndex('min', min)
  render()
  scrollToValue('period', periodOf())
  scrollToValue('hour', hour)
  scrollToValue('min', min)
  silent = false
  const autoLaunch = (document.getElementById('auto-launch') as HTMLInputElement | null)?.checked ?? true
  panelWrapEl?.classList.toggle('is-disabled', !autoLaunch)
  updateCountdown()
  window.setInterval(updateCountdown, 30000)

  // ---------- Listen to form change event（原邏輯不變＋toast） ----------
  document.querySelector('form')?.addEventListener('change', e => {
    const target = e.target as HTMLInputElement
    if (e.type === 'change' && target !== null) {
      const id = target.id
      const type = target.type
      const value = type === 'checkbox'
        ? target.checked
        : target.value
      const isLocal = id.startsWith(configLocalPrefix)
      const key = camelize(id)

      const baseConfig = isLocal ? defConfigLocal : defConfig
      if (key in baseConfig) {
        setStorageData({
          [key]: value,
        }, isLocal)
        if (id === 'launch-time') {
          const t = parseTime(String(value))
          hour = t.h
          min = t.m
          render()
          scrollToValue('period', periodOf())
          scrollToValue('hour', hour)
          scrollToValue('min', min)
          toastSaved(`已儲存・每天 ${timeStr()} 簽到`)
        } else {
          toastSaved('已儲存設定')
        }
      }
      if (id === 'auto-launch') {
        panelWrapEl?.classList.toggle('is-disabled', !target.checked)
      }
    }
  })
})()
