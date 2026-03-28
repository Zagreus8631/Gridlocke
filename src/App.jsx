// FIXED VERSION (nur die genannten Punkte angepasst)
import { useState, useEffect } from "react";

const emptyGrid = Array(9).fill(null);

const typeColors = {
  fire: "#e74c3c",
  water: "#3498db",
  grass: "#2ecc71",
  electric: "#f1c40f",
  normal: "#bdc3c7"
};

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [graveyard, setGraveyard] = useState([]);

  const [pokemonList, setPokemonList] = useState([]);
  const [points, setPoints] = useState(3);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const addPoint = () => {
    setPoints(prev => Math.min(3, prev + 1));
  };

  const [eraser, setEraser] = useState(false);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [nickname, setNickname] = useState("");

  const [pattern, setPattern] = useState(Array(9).fill(false));
  const [requiredTiles, setRequiredTiles] = useState(1);
  const [patternModal, setPatternModal] = useState(null);

  const [message, setMessage] = useState("");
  const [evoModal, setEvoModal] = useState(null);
  const [evoSearch, setEvoSearch] = useState("");

  const [speciesPatterns, setSpeciesPatterns] = useState({});

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=200")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const evoFiltered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(evoSearch.toLowerCase())
  );

  const getEVTiles = (stats) => {
    const ev = stats.reduce((sum, s) => sum + s.effort, 0);
    return Math.max(1, ev + 1);
  };

  const getOffsets = (pattern) => {
    const active = pattern.map((v, i) => (v ? i : null)).filter(v => v !== null);
    if (!active.length) return [];
    const base = active[0];

    return active.map(i => {
      const r = Math.floor(i / 3);
      const c = i % 3;
      const br = Math.floor(base / 3);
      const bc = base % 3;
      return [r - br, c - bc];
    });
  };

  const getGridIndex = (start, offset) => {
    const r = Math.floor(start / 3) + offset[0];
    const c = (start % 3) + offset[1];
    if (r < 0 || r > 2 || c < 0 || c > 2) return null;
    return r * 3 + c;
  };

  const placeOnGrid = (index, pokemon) => {
    if (!pokemon) return;

    const current = team.find(t => t.id === pokemon.id) || pokemon;

    let newGrid = [...grid];
    newGrid = newGrid.map(c => (c === current.id ? null : c));

    const offsets = getOffsets(current.pattern);

    for (let o of offsets) {
      const pos = getGridIndex(index, o);
      if (pos === null || newGrid[pos]) {
        setMessage("Ungültige Position");
        return;
      }

      const neighbors = [pos - 1, pos + 1, pos - 3, pos + 3];

      for (let n of neighbors) {
        if (
          n >= 0 && n < 9 &&
          newGrid[n]
        ) {
          const neighborPokemon = team.find(t => t.id === newGrid[n]);
          if (neighborPokemon?.color === current.color) {
            setMessage("Gleiche Farbe darf nicht angrenzen!");
            return;
          }
        }
      }
    }

    offsets.forEach(o => {
      const pos = getGridIndex(index, o);
      newGrid[pos] = current.id;
    });

    setGrid(newGrid);
    setMessage("");
  };

  const handleGridClick = (index) => {
    const cellId = grid[index];
    const cell = team.find(t => t.id === cellId);

    if (eraser && cell) {
      const pokemonInTeam = team.find(t => t.id === cell.id);
      if (!pokemonInTeam || points <= 0) return;

      const positions = grid
        .map((c, i) => (c === cell.id ? i : null))
        .filter(v => v !== null);

      if (positions.length <= 1) return;

      const patternIndex = positions.indexOf(index);
      if (patternIndex === -1) return;

      const newPattern = [...pokemonInTeam.pattern];

      let count = 0;
      for (let i = 0; i < 9; i++) {
        if (pokemonInTeam.pattern[i]) {
          if (count === patternIndex) {
            newPattern[i] = false;
            break;
          }
          count++;
        }
      }

      setPoints(prev => prev - 1);

      setTeam(prev =>
        prev.map(t =>
          t.id === cell.id
            ? { ...t, pattern: newPattern }
            : t
        )
      );

      let newGrid = [...grid];
      newGrid = newGrid.map(c => (c === cell.id ? null : c));

      const offsets = getOffsets(newPattern);
      offsets.forEach(o => {
        const pos = getGridIndex(index, o);
        if (pos !== null) newGrid[pos] = cell.id;
      });

      setGrid(newGrid);
      return;
    }

    if (cell) {
      const current = team.find(t => t.id === cell.id) || cell;
      setDragging(current);
      setSelected(current);
    } else if (dragging) {
      placeOnGrid(index, dragging);
      setDragging(null);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      <div>
        ⭐ Punkte: {points}
        <button onClick={addPoint} disabled={points >= 3}>
          ➕ Punkt
        </button>
      </div>

      <button onClick={() => setEraser(prev => !prev)}>
        🧽 {eraser ? "AN" : "AUS"}
      </button>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,80px)" }}>
        {grid.map((cell, i) => {
          const pokemon = team.find(t => t.id === cell);

          return (
            <div
              key={i}
              onClick={() => handleGridClick(i)}
              style={{
                width: 80,
                height: 80,
                border: "1px solid black",
                background: pokemon ? pokemon.color : "white"
              }}
            >
              {pokemon && <img src={pokemon.sprite} width={40} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
