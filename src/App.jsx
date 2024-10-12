import React, { useEffect, useState } from 'react';
import { openDB } from 'idb';

// IndexedDB functions
const DB_NAME = 'timeEntriesDB';
const STORE_NAME = 'entries';

async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    }
  });
}

async function addEntry(entry) {
  const db = await initDB();
  return db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).add(entry);
}

async function getEntries() {
  const db = await initDB();
  return db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll();
}

async function deleteEntry(id) {
  const db = await initDB();
  return db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id);
}

async function updateEntry(entry) {
  const db = await initDB();
  return db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(entry);
}

// TimeForm component
function TimeForm({ onSubmit, currentEntry }) {
  const [hours, setHours] = useState(currentEntry ? currentEntry.hours : '');
  const [minutes, setMinutes] = useState(currentEntry ? currentEntry.minutes : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const entry = {
      hours: parseInt(hours, 10),
      minutes: parseInt(minutes, 10),
      createdAt: new Date(),
    };
    onSubmit(entry);
    setHours('');
    setMinutes('');
  };

  return (
    <form onSubmit={handleSubmit} className='p-2 d-flex justify-content-center'>
      <input
        type="number"
        placeholder="Horas"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        className='m-1 p-2 w-25'
        required
      />
      <input
        type="number"
        placeholder="Minutos"
        value={minutes}
        onChange={(e) => setMinutes(e.target.value)}
        className='m-1 p-2 w-25'
        required
      />
      <button type="submit" className='btn btn-outline-primary m-1'>Guardar</button>
    </form>
  );
}

// TimeList component
function TimeList({ entries, onEdit, onDelete }) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <ul className='list-group p-3 pb-5 mb-5'>
      {entries.map(entry => (
        <li key={entry.id} className='p-2 d-flex align-items-center list-group-item text-white bg-dark'>
          <p className='flex-grow-1 fs-5 fw-bolder'>{entry.hours}:{entry.minutes} <br />
          <span className='fs-6 fw-light text-white-50'>{formatDate(entry.createdAt)}</span></p>
          <button onClick={() => onDelete(entry.id)} className='m-2 btn btn-danger'>Eliminar</button>
        </li>
      ))}
    </ul>
  );
}

// App component
function App() {
  const [entries, setEntries] = useState([]);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    // Reinicia el contador mensual al cambiar de mes
    if (month !== currentMonth) {
      resetMonthlyCount();
      setCurrentMonth(month);
    }

    // Reinicia el contador anual al cambiar de año
    if (year !== currentYear) {
      resetAnnualCount();
      setCurrentYear(year);
    }
  }, [entries, currentMonth, currentYear]);

  const loadEntries = async () => {
    const entries = await getEntries();
    setEntries(entries);
  };

  const handleAddEntry = async (entry) => {
    if (editingEntry) {
      entry.id = editingEntry.id;
      await updateEntry(entry);
      setEditingEntry(null);
    } else {
      await addEntry(entry);
    }
    loadEntries();
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
  };

  const handleDeleteEntry = async (id) => {
    await deleteEntry(id);
    loadEntries();
  };

  const resetMonthlyCount = () => {
    // Aquí podrías guardar el total mensual en otro estado o base de datos si es necesario
    console.log('Reiniciando contador mensual');
  };

  const resetAnnualCount = () => {
    // Aquí podrías guardar el total anual en otro estado o base de datos si es necesario
    console.log('Reiniciando contador anual');
  };

  const getTotalTimeByMonth = () => {
    const totalsByMonth = {};
    entries.forEach(entry => {
      const date = new Date(entry.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!totalsByMonth[monthKey]) {
        totalsByMonth[monthKey] = 0;
      }
      totalsByMonth[monthKey] += entry.hours * 60 + entry.minutes;
    });

    return Object.keys(totalsByMonth).map(monthKey => {
      const totalMinutes = totalsByMonth[monthKey];
      const totalHours = Math.floor(totalMinutes / 60);
      const minutesLeft = totalMinutes % 60;
      return (
        <li key={monthKey} className='list-group-item text-start text-white bg-dark'>
          {monthKey}: {totalHours}:{minutesLeft}
        </li>
      );
    });
  };

  const getTotalTimeByYear = () => {
    const totalsByYear = {};
    entries.forEach(entry => {
      const date = new Date(entry.createdAt);
      const yearKey = date.getFullYear();
      if (!totalsByYear[yearKey]) {
        totalsByYear[yearKey] = 0;
      }
      totalsByYear[yearKey] += entry.hours * 60 + entry.minutes;
    });

    return Object.keys(totalsByYear).map(yearKey => {
      const totalMinutes = totalsByYear[yearKey];
      const totalHours = Math.floor(totalMinutes / 60);
      const minutesLeft = totalMinutes % 60;
      return (
        <li key={yearKey} className='list-group-item text-start text-white bg-dark'>
          {yearKey}: {totalHours}:{minutesLeft}
        </li>
      );
    });
  };

  return (
    <div>
      <details className='navbar bg-dark text-white fixed-top border-bottom border-primary'>
        <summary className='p-2'></summary>
        <TimeForm onSubmit={handleAddEntry} currentEntry={editingEntry} />
      </details>
      <div className='pt-5 bg-dark text-white pb-5'>
        <div className='pt-4'></div>
        <h1 className='p-3'>Registro de Tiempo</h1>
        <TimeList entries={entries} onEdit={handleEditEntry} onDelete={handleDeleteEntry} />
        <div className='p-3 d-flex justify-content-between fixed-bottom border-top bg-dark'>
          <div>
            <h2 className='fs-4'>Total por Mes</h2>
            <ul className='list-group bg-dark'>{getTotalTimeByMonth()}</ul>
          </div>
          <div>
            <h2 className='fs-4'>Total por Año</h2>
            <ul className='list-group bg-dark'>{getTotalTimeByYear()}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
