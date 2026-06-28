// =====================================================================
//  Scheduler — calendar-like grid of 15-minute slots for a chosen day.
//  Already-booked slots (for the active matchmaker) are disabled so the
//  DB exclusion constraint is never hit in normal use.
// =====================================================================
import { useEffect, useMemo, useState } from 'react';
import { interviewsApi } from '../shared/api';

const SLOT_MINUTES = 15;
const DAY_START_HOUR = 9; // 09:00
const DAY_END_HOUR = 18; // 18:00

function buildSlots(dateStr) {
  const slots = [];
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) {
    for (let m = 0; m < 60; m += SLOT_MINUTES) {
      const d = new Date(`${dateStr}T00:00:00`);
      d.setHours(h, m, 0, 0);
      slots.push(d);
    }
  }
  return slots;
}

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Scheduler({ matchmakerId, candidate, onBooked }) {
  const [day, setDay] = useState(todayStr());
  const [booked, setBooked] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const slots = useMemo(() => buildSlots(day), [day]);

  // Fetch the matchmaker's booked slots for the chosen day.
  useEffect(() => {
    if (!matchmakerId) return;
    let active = true;
    const dayStart = new Date(`${day}T00:00:00`).toISOString();
    const dayEnd = new Date(`${day}T23:59:59`).toISOString();
    interviewsApi
      .bookedSlots(matchmakerId, dayStart, dayEnd)
      .then((rows) => {
        if (!active) return;
        setBooked(new Set(rows.map((r) => new Date(r.slot_start).getTime())));
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [matchmakerId, day, busy]);

  const handleBook = async (slot) => {
    if (!candidate) {
      setError('Select a candidate first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await interviewsApi.book({
        candidateId: candidate.id,
        matchmakerId,
        slotStart: slot.toISOString(),
      });
      onBooked?.(slot);
    } catch (err) {
      // Unique / exclusion violation => slot already taken.
      setError(
        err.code === '23505' || err.code === '23P01'
          ? 'That slot was just taken. Pick another.'
          : err.message
      );
    } finally {
      setBusy(false);
    }
  };

  const now = Date.now();

  return (
    <div className="scheduler">
      <div className="scheduler__toolbar">
        <label className="field__label" htmlFor="sched-day">
          Day
        </label>
        <input
          id="sched-day"
          type="date"
          className="input"
          value={day}
          min={todayStr()}
          onChange={(e) => setDay(e.target.value)}
        />
        {candidate && (
          <span className="scheduler__candidate">
            Booking for <strong>{candidate.full_name || 'candidate'}</strong>
          </span>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="scheduler__grid">
        {slots.map((slot) => {
          const ts = slot.getTime();
          const isBooked = booked.has(ts);
          const isPast = ts < now;
          return (
            <button
              key={ts}
              type="button"
              className={
                'slot' +
                (isBooked ? ' slot--booked' : '') +
                (isPast ? ' slot--past' : '')
              }
              disabled={isBooked || isPast || busy}
              onClick={() => handleBook(slot)}
              title={isBooked ? 'Already booked' : 'Book this slot'}
            >
              {fmtTime(slot)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
