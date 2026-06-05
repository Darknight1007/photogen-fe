"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** ISO / API date → `datetime-local` value in local timezone */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function splitValue(value: string): { date: string; time: string } {
  if (!value) return { date: "", time: "" };
  const [date, timePart = ""] = value.split("T");
  return { date, time: timePart.slice(0, 5) };
}

function mergeDateTime(date: string, time: string): string {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

function parseDateParts(date: string): { y: number; m: number; d: number } | null {
  if (!date) return null;
  const [ys, ms, ds] = date.split("-").map(Number);
  if (!ys || !ms || !ds) return null;
  return { y: ys, m: ms - 1, d: ds };
}

function formatDateLabel(date: string): string {
  const p = parseDateParts(date);
  if (!p) return "Select date";
  return new Date(p.y, p.m, p.d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeLabel(time: string): string {
  if (!time) return "Select time";
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function parseTime24(time: string): { hour12: number; minute: number; pm: boolean } {
  const [h = 0, m = 0] = time.split(":").map(Number);
  const pm = h >= 12;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return { hour12, minute: m, pm };
}

function toHour24(hour12: number, pm: boolean): number {
  if (hour12 === 12) return pm ? 12 : 0;
  return pm ? hour12 + 12 : hour12;
}

function toTime24(hour12: number, minute: number, pm: boolean): string {
  const h = toHour24(hour12, pm);
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

type CalendarCell = { day: number; month: number; year: number; inMonth: boolean };

function buildCalendar(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let i = first - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    const d = new Date(year, month - 1, day);
    cells.push({ day, month: d.getMonth(), year: d.getFullYear(), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, month, year, inMonth: true });
  }
  let nextDay = 1;
  while (cells.length < 42) {
    const d = new Date(year, month + 1, nextDay);
    cells.push({ day: nextDay, month: d.getMonth(), year: d.getFullYear(), inMonth: false });
    nextDay++;
  }
  return cells;
}

function sameDay(a: CalendarCell, b: { y: number; m: number; d: number } | null): boolean {
  if (!b) return false;
  return a.year === b.y && a.month === b.m && a.day === b.d;
}

function isToday(cell: CalendarCell): boolean {
  const t = new Date();
  return cell.year === t.getFullYear() && cell.month === t.getMonth() && cell.day === t.getDate();
}

interface EventDateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function EventDateTimePicker({ value, onChange, className = "" }: EventDateTimePickerProps) {
  const { date, time } = splitValue(value);
  const selected = parseDateParts(date);
  const parsedTime = parseTime24(time || "12:00");

  const [open, setOpen] = useState<"date" | "time" | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const initialView = selected ?? {
    y: new Date().getFullYear(),
    m: new Date().getMonth(),
    d: new Date().getDate(),
  };
  const [viewYear, setViewYear] = useState(initialView.y);
  const [viewMonth, setViewMonth] = useState(initialView.m);

  const [hour12, setHour12] = useState(parsedTime.hour12);
  const [minute, setMinute] = useState(parsedTime.minute);
  const [pm, setPm] = useState(parsedTime.pm);

  useEffect(() => {
    const t = parseTime24(time || "12:00");
    setHour12(t.hour12);
    setMinute(t.minute);
    setPm(t.pm);
  }, [time]);

  useEffect(() => {
    if (selected) {
      setViewYear(selected.y);
      setViewMonth(selected.m);
    }
  }, [date]);

  const cells = useMemo(() => buildCalendar(viewYear, viewMonth), [viewYear, viewMonth]);

  const close = useCallback(() => setOpen(null), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  const setDate = (y: number, m: number, d: number) => {
    const next = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    onChange(mergeDateTime(next, time));
    close();
  };

  const applyTime = () => {
    if (!date) return;
    onChange(mergeDateTime(date, toTime24(hour12, minute, pm)));
    close();
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 4 }, (_, i) => i * 15);

  return (
    <div className={`pg-datetime ${className}`.trim()} ref={rootRef}>
      <div className="pg-datetime-cell">
        <button
          type="button"
          className={`pg-datetime-trigger${open === "date" ? " is-open" : ""}${date ? " has-value" : ""}`}
          onClick={() => setOpen(open === "date" ? null : "date")}
          aria-expanded={open === "date"}
          aria-haspopup="dialog"
        >
          <span className="pg-datetime-trigger-icon" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </span>
          <span className="pg-datetime-trigger-text">{formatDateLabel(date)}</span>
          <span className="pg-datetime-chevron" aria-hidden>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>

        {open === "date" && (
          <div className="pg-picker-panel" role="dialog" aria-label="Choose date">
            <div className="pg-cal-header">
              <button type="button" className="pg-cal-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="pg-cal-title">
                {MONTHS[viewMonth]}
                <select 
                  className="pg-cal-select" 
                  value={viewYear} 
                  onChange={(e) => setViewYear(Number(e.target.value))}
                >
                  {Array.from({ length: 51 }, (_, i) => 2000 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </span>
              <button type="button" className="pg-cal-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="pg-cal-weekdays">
              {WEEKDAYS.map((d) => (
                <span key={d} className="pg-cal-weekday">{d}</span>
              ))}
            </div>
            <div className="pg-cal-grid">
              {cells.map((cell, i) => {
                const sel = sameDay(cell, selected);
                const today = isToday(cell);
                return (
                  <button
                    key={`${cell.year}-${cell.month}-${cell.day}-${i}`}
                    type="button"
                    className={[
                      "pg-cal-day",
                      !cell.inMonth && "is-outside",
                      sel && "is-selected",
                      today && "is-today",
                    ].filter(Boolean).join(" ")}
                    onClick={() => setDate(cell.year, cell.month, cell.day)}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
            <div className="pg-picker-footer">
              <button
                type="button"
                className="pg-picker-link"
                onClick={() => {
                  const t = new Date();
                  setDate(t.getFullYear(), t.getMonth(), t.getDate());
                }}
              >
                Today
              </button>
              {date && (
                <button
                  type="button"
                  className="pg-picker-link pg-picker-link-muted"
                  onClick={() => {
                    onChange("");
                    close();
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="pg-datetime-cell">
        <button
          type="button"
          className={`pg-datetime-trigger${open === "time" ? " is-open" : ""}${time ? " has-value" : ""}`}
          onClick={() => date && setOpen(open === "time" ? null : "time")}
          disabled={!date}
          aria-expanded={open === "time"}
          aria-haspopup="dialog"
        >
          <span className="pg-datetime-trigger-icon" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M12 7v5l3 2" />
            </svg>
          </span>
          <span className="pg-datetime-trigger-text">{date ? formatTimeLabel(time) : "Select time"}</span>
          <span className="pg-datetime-chevron" aria-hidden>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </button>

        {open === "time" && date && (
          <div className="pg-picker-panel pg-time-panel" role="dialog" aria-label="Choose time">
            <p className="pg-time-preview">
              {new Date(2000, 0, 1, toHour24(hour12, pm), minute).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <div className="pg-time-body">
              <div className="pg-time-col">
                <span className="pg-time-col-label">Hour</span>
                <div className="pg-time-scroll">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`pg-time-opt${hour12 === h ? " is-selected" : ""}`}
                      onClick={() => setHour12(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <span className="pg-time-sep">:</span>
              <div className="pg-time-col">
                <span className="pg-time-col-label">Min</span>
                <div className="pg-time-scroll">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`pg-time-opt${minute === m ? " is-selected" : ""}`}
                      onClick={() => setMinute(m)}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pg-time-ampm">
                <button
                  type="button"
                  className={`pg-time-ampm-btn${!pm ? " is-selected" : ""}`}
                  onClick={() => setPm(false)}
                >
                  AM
                </button>
                <button
                  type="button"
                  className={`pg-time-ampm-btn${pm ? " is-selected" : ""}`}
                  onClick={() => setPm(true)}
                >
                  PM
                </button>
              </div>
            </div>
            <div className="pg-picker-footer">
              <button type="button" className="pg-picker-apply" onClick={applyTime}>
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
