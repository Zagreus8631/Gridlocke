import { useState, useEffect } from "react";

const emptyGrid = Array(9).fill(null);

const typeColors = {
  fire: "#e74c3c",
  water: "#3498db",
  grass: "#2ecc71",
  electric: "#f1c40f",
  psychic: "#ff69b4",
  ice: "#5dade2",
  dragon: "#6a7baf",
  dark: "#2c3e50",
  fairy: "#e397d1",
  normal: "#bdc3c7"
};

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);

  const [selected, setSelected] = useState(null);

  const [showCatch, setShowCatch] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const [globalDB, setGlobalDB] = useState({});
  const [pattern, setPattern] = useState("0");

  const [points, setPoints] = useState(0);

  // Load Pokémon
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=200")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // FIXED GRID POSITIONING
  const getPosition = (start, offset) => {
    const row = Math.floor(start / 3);
    const col = start % 3;

    const oRow = Math.floor(offset / 3);
    const oCol = offset % 3;

    const newRow = row + oRow;
    const newCol = col + oCol;

    if (newRow > 2 || newCol > 2) return null;

    return newRow * 3 + newCol;
  };

  const isValidPlacement = (pattern, startIndex, pokemon) => {
    return pattern.every(p => {
      const pos = getPosition(startIndex, p);
      if (pos === null) return false;
      if (grid[pos]) return false;

      const neighbors = [pos - 1, pos + 1, pos - 3, pos + 3];

      return neighbors.every(n => {
        if (n < 0 || n >= 9) return true;
        if (!grid[n]) return true;
        return grid[n].color !== pokemon.color;
      });
    });
  };

  const placeOnGrid = (index) => {
    if (!selected) return;

    if (!isValidPlacement(selected.pattern, index, selected)) return;

    const newGrid = [...grid];

    selected.pattern.forEach(p => {
      const pos = getPosition(index, p);
      newGrid[pos] = selected;
    });

    setGrid(newGrid);
  };

  const removePokemon = (pokemonId) => {
    const newGrid = grid.map(cell =>
      cell?.id === pokemonId ? null : cell
    );
    setGrid(newGrid);
  };

  const catchPokemon = async () => {
    if (!selectedPokemon) return;

    const res = await fetch(selectedPokemon.url);
    const data = await res.json();

    let base = globalDB[data.name];

    if (!base) {
      base = {
        color: typeColors[data.types[0].type.name] || "gray",
        pattern: pattern.split(",").map(n => parseInt(n))
      };

      setGlobalDB(prev => ({
        ...prev,
        [data.name]: base
      }));
    }

    const newPokemon = {
      id: Date.now() + Math.random(),
      name: data.name,
      nickname: data.name,
      sprite: data.sprites.front_default,
      ...base
    };

    setBox(prev => [...prev, newPokemon]);

    setSelectedPokemon(null);
    setSearch("");
  };

  const moveToTeam = (p) => {
    if (team.length >= 6) return;
    setTeam(prev => [...prev, p]);
    setBox(prev => prev.filter(x => x.id !== p.id));
  };

  const addPoint = () => {
    if (points < 3) setPoints(points + 1);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      <p>Punkte: {points}</p>
      <button onClick={addPoint}>+ Punkt</button>

      <div style={{ display: "flex", gap: 40 }}>
        
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 80px)",
              gap: 5
            }}
          >
            {grid.map((cell, i) => (
              <div
                key={i}
                onClick={() => cell && removePokemon(cell.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => placeOnGrid(i)}
                style={{
                  width: 80,
                  height: 80,
                  border: "1px solid black",
                  background: cell ? cell.color : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                {cell && <img src={cell.sprite} width={50} />}
              </div>
            ))}
          </div>
        </div>

        {/* TEAM RIGHT SIDE */}
        <div>
          <h2>Team</h2>
          {team.map(p => (
            <div
              key={p.id}
              draggable
              onDragStart={() => setSelected(p)}
              style={{ marginBottom: 10 }}
            >
              <img src={p.sprite} width={40} />

              <input
                value={p.nickname}
                onChange={(e) => {
                  const newTeam = team.map(x =>
                    x.id === p.id
                      ? { ...x, nickname: e.target.value }
                      : x
                  );
                  setTeam(newTeam);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* BOX */}
      <h2>Box</h2>
      {box.map(p => (
        <div key={p.id}>
          <img src={p.sprite} width={40} />
          <span>{p.name}</span>
          <button onClick={() => moveToTeam(p)}>To Team</button>
        </div>
      ))}

      {/* Catch */}
      <button onClick={() => setShowCatch(true)}>
        Catch Pokemon
      </button>

      {showCatch && (
        <div style={{ border: "2px solid black", padding: 10 }}>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.slice(0, 10).map(p => (
            <div key={p.name} onClick={() => setSelectedPokemon(p)}>
              {p.name}
            </div>
          ))}

          {selectedPokemon && (
            <>
              <p>{selectedPokemon.name}</p>
              <input
                placeholder="Pattern (z.B. 0,1,3)"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
              />
            </>
          )}

          <button onClick={catchPokemon}>Catch</button>
          <button onClick={() => setShowCatch(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
