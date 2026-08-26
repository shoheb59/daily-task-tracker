'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const PEOPLE = ['Tahmina', 'Hasnat', 'Nitol', 'Hridoy'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function emptyEntries() {
  const e = {};
  PEOPLE.forEach((p) => (e[p] = { task: '', jira_link: '' }));
  return e;
}

export default function Home() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('Loading…');
  const [editingKey, setEditingKey] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const { data, error } = await supabase.from('tasks').select('*').order('date', { ascending: true });

    if (error) {
      setStatus("Couldn't load data: " + error.message);
      setLoading(false);
      return;
    }

    const byDate = {};
    (data || []).forEach((r) => {
      if (!byDate[r.date]) {
        byDate[r.date] = { date: r.date, entries: emptyEntries() };
      }
      byDate[r.date].entries[r.person] = { task: r.task || '', jira_link: r.jira_link || '' };
    });

    setRows(Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date)));
    setLoading(false);
    setStatus('Synced with Supabase.');
  }

  function addDay() {
    const date = todayISO();
    if (rows.some((r) => r.date === date)) {
      setStatus('That day is already on the board.');
      return;
    }
    setRows((prev) => [...prev, { date, entries: emptyEntries() }].sort((a, b) => a.date.localeCompare(b.date)));
    setStatus('New day added — fill in a cell to save it.');
  }

  async function changeDate(oldDate, newDate) {
    if (!newDate || newDate === oldDate) return;
    if (rows.some((r) => r.date === newDate)) {
      setStatus('A row for that date already exists.');
      return;
    }
    const { error } = await supabase.from('tasks').update({ date: newDate }).eq('date', oldDate);
    if (error) {
      setStatus("Couldn't update date: " + error.message);
      return;
    }
    setRows((prev) =>
      prev.map((r) => (r.date === oldDate ? { ...r, date: newDate } : r)).sort((a, b) => a.date.localeCompare(b.date))
    );
    setStatus('Date updated.');
  }

  async function removeDay(date) {
    const { error } = await supabase.from('tasks').delete().eq('date', date);
    if (error) {
      setStatus("Couldn't remove day: " + error.message);
      return;
    }
    setRows((prev) => prev.filter((r) => r.date !== date));
    setStatus('Day removed.');
  }

  async function saveCell(date, person, task, jiraLink) {
    let jira = jiraLink.trim();
    if (jira && !/^https?:\/\//i.test(jira)) jira = 'https://' + jira;
    const cleanTask = task.trim();

    const { error } = await supabase
      .from('tasks')
      .upsert({ date, person, task: cleanTask, jira_link: jira }, { onConflict: 'date,person' });

    if (error) {
      setStatus("Couldn't save: " + error.message);
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.date === date ? { ...r, entries: { ...r.entries, [person]: { task: cleanTask, jira_link: jira } } } : r
      )
    );
    setEditingKey(null);
    setStatus('Saved.');
  }

  if (loading) {
    return (
      <div className="wrap">
        <p className="sub">Loading tracker…</p>
      </div>
    );
  }

  return (
    <div className="wrap">
      <div className="topbar">
        <div>
          <h1>Daily task tracker</h1>
          <p className="sub">Tahmina · Hasnat · Nitol · Hridoy — click a cell to log a task and its Jira link.</p>
        </div>
        <div className="actions">
          <button className="btn-primary" onClick={addDay}>
            + Add day
          </button>
        </div>
      </div>

      <div className="board">
        {rows.length === 0 ? (
          <div className="empty-state">No days yet. Click &quot;Add day&quot; to start tracking.</div>
        ) : (
          <table>
            <colgroup>
              <col className="date-col" />
              <col />
              <col />
              <col />
              <col />
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                {PEOPLE.map((p) => (
                  <th key={p}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.date}>
                  <td className="date-cell">
                    <input type="date" defaultValue={row.date} onBlur={(e) => changeDate(row.date, e.target.value)} />
                    <button className="row-remove" onClick={() => removeDay(row.date)}>
                      Remove day
                    </button>
                  </td>
                  {PEOPLE.map((person) => {
                    const key = `${row.date}|${person}`;
                    const entry = row.entries[person] || { task: '', jira_link: '' };
                    return (
                      <td key={person}>
                        <Cell
                          entry={entry}
                          person={person}
                          editing={editingKey === key}
                          onOpen={() => setEditingKey(key)}
                          onCancel={() => setEditingKey(null)}
                          onSave={(task, jira) => saveCell(row.date, person, task, jira)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="status">{status}</div>
    </div>
  );
}

function Cell({ entry, person, editing, onOpen, onCancel, onSave }) {
  const [task, setTask] = useState(entry.task);
  const [jira, setJira] = useState(entry.jira_link);

  useEffect(() => {
    setTask(entry.task);
    setJira(entry.jira_link);
  }, [entry, editing]);

  if (!editing) {
    return (
      <div className="cell" onClick={onOpen}>
        <div className={'task-text' + (entry.task ? '' : ' empty')}>{entry.task || 'Click to add a task…'}</div>
        {entry.jira_link && (
          <a
            className="jira-pill"
            href={entry.jira_link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            Jira ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="cell editing">
      <textarea
        autoFocus
        placeholder={`What did ${person} work on?`}
        value={task}
        onChange={(e) => setTask(e.target.value)}
      />
      <input type="url" placeholder="Jira link (optional)" value={jira} onChange={(e) => setJira(e.target.value)} />
      <div className="edit-row">
        <button className="save-btn" onClick={() => onSave(task, jira)}>
          Save
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
