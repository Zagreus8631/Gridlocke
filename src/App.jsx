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
  const [showEvolve, setShowEvolve] = useState(null);

  const [search, setSearch] = useState("");
  const [selectedPokemon, setSelectedPokemon] = useState(null);

  const [pattern, setPattern] = useState(Array(9).fill(false));
  const [nickname, setNickname] = useState("");

  const [points, setPoints] = useState(0);
  const [message, setMessage] = useState("");

  // Load Pokémon
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=200")
      .then(res => res.json())
      .then(data => setPokemonList(data.results));
  }, []);

  const filtered = pokemonList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pattern → Indexe
  const patternToOffsets = (pattern) => {
    return pattern
      .map((val, i) => (val ? i : null))
      .filter(v => v !== null);
  };

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

  const isValidPlacement = (patternOffsets, startIndex, pokemon) => {
    for (let p of patternOffsets) {
      const pos = getPosition(startIndex, p);

      if (pos === null) {
        setMessage("Muster passt nicht ins Grid");
        return false;
      }

      if (grid[pos]) {
        setMessage("Dieser Platz ist bereits belegt");
        return false;
      }

      const neighbors = [pos - 1, pos + 1, pos - 3, pos + 3];

      for (let n of neighbors) {
        if (n >= 0 && n < 9 && grid[n]) {
          if (grid[n].color === pokemon.color) {
            setMessage("Gleiche Farben dürfen nicht nebeneinander sein");
            return false;
          }
        }
      }
    }

    setMessage("");
    return true;
  };

  const placeOnGrid = (index) => {
    if (!selected) return;

    const offsets = patternToOffsets(selected.pattern);

    if (!isValidPlacement(offsets, index, selected)) return;

    const newGrid = [...grid];

    offsets.forEach(p => {
      const pos = getPosition(index, p);
      newGrid[pos] = selected;
    });

    setGrid(newGrid);
  };

  const removeFromTeam = (pokemonId) => {
    setTeam(prev => prev.filter(p => p.id !== pokemonId));
    setGrid(prev => prev.map(c => (c?.id === pokemonId ? null : c)));
  };

  const catchPokemon = async () => {
    if (!selectedPokemon || !nickname) return;

    const res = await fetch(selectedPokemon.url);
    const data = await res.json();

    const offsets = patternToOffsets(pattern);

    const newPokemon = {
      id: Date.now(),
      name: data.name,
      nickname,
      sprite: data.sprites.front_default,
      color: typeColors[data.types[0].type.name] || "gray",
      pattern,
      usedPoints: 0
    };

    setBox(prev => [...prev, newPokemon]);

    setPattern(Array(9).fill(false));
    setNickname("");
    setSelectedPokemon(null);
  };

  const moveToTeam = (p) => {
    if (team.length >= 6) return;
    setTeam(prev => [...prev, p]);
    setBox(prev => prev.filter(x => x.id !== p.id));
  };

  const addPoint = () => {
    if (points < 3) setPoints(points + 1);
  };

  // Radiergummi
  const eraseTile = (pokemon) => {
    if (points < 1) return;

    const newPattern = [...pokemon.pattern];
    const index = newPattern.lastIndexOf(true);
    if (index !== -1) newPattern[index] = false;

    pokemon.pattern = newPattern;
    pokemon.usedPoints += 1;

    setPoints(points - 1);
    setTeam([...team]);
  };

  // Pinsel
  const changeColor = (pokemon) => {
    if (points < 2) return;

    pokemon.color = "#000000";
    pokemon.usedPoints += 2;

    setPoints(points - 2);
    setTeam([...team]);
  };

  // Pattern Editor Toggle
  const togglePattern = (i) => {
    const newPattern = [...pattern];
    newPattern[i] = !newPattern[i];
    setPattern(newPattern);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid</h1>

      <h2>Punkte: {points}</h2>
      <button onClick={addPoint}>+ Punkt</button>

      {message && <p style={{ color: "red" }}>{message}</p>}

      <div style={{ display: "flex", gap: 40 }}>
        
        {/* GRID */}
        <div>
          <h2>Grid</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)", gap: 5 }}>
            {grid.map((cell, i) => (
              <div
                key={i}
                title={cell ? `${cell.nickname}` : ""}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => placeOnGrid(i)}
                style={{
                  width: 80,
                  height: 80,
                  border: "1px solid black",
                  background: cell ? cell.color : "white",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                {cell && <img src={cell.sprite} width={40} />}
              </div>
            ))}
          </div>
        </div>

        {/* TEAM */}
        <div>
          <h2>Team</h2>
          {team.map(p => (
            <div key={p.id} style={{ marginBottom: 15 }}>
              <div
                draggable
                onDragStart={() => setSelected(p)}
              >
                <img src={p.sprite} width={40} />
                <span>{p.nickname}</span>
              </div>

              {/* Pattern Preview */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 10px)" }}>
                {p.pattern.map((val, i) => (
                  <div
                    key={i}
                    style={{
                      width: 10,
                      height: 10,
                      background: val ? p.color : "#eee"
                    }}
                  />
                ))}
              </div>

              <button onClick={() => removeFromTeam(p.id)}>Remove</button>
              <button onClick={() => eraseTile(p)}>🧽</button>
              <button onClick={() => changeColor(p)}>🖌️</button>
              <button onClick={() => setShowEvolve(p)}>Evolve</button>
            </div>
          ))}
        </div>
      </div>

      {/* BOX */}
      <h2>Box</h2>
      {box.map(p => (
        <div key={p.id}>
          <img src={p.sprite} width={40} />
          <span>{p.nickname}</span>
          <button onClick={() => moveToTeam(p)}>To Team</button>
        </div>
      ))}

      <button onClick={() => setShowCatch(true)}>Catch Pokemon</button>

      {/* Catch */}
      {showCatch && (
        <div>
          <input value={search} onChange={(e) => setSearch(e.target.value)} />

          {filtered.slice(0, 10).map(p => (
            <div key={p.name} onClick={() => setSelectedPokemon(p)}>
              {p.name}
            </div>
          ))}

          {/* Pattern Editor */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 40px)" }}>
            {pattern.map((val, i) => (
              <div
                key={i}
                onClick={() => togglePattern(i)}
                style={{
                  width: 40,
                  height: 40,
                  background: val ? "black" : "#eee",
                  border: "1px solid black"
                }}
              />
            ))}
          </div>

          <input
            placeholder="Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <button onClick={catchPokemon}>Catch</button>
        </div>
      )}

      {/* Evolution */}
      {showEvolve && (
        <div>
          <h3>Entwickeln</h3>

          {filtered.slice(0, 10).map(p => (
            <div
              key={p.name}
              onClick={() => {
                showEvolve.name = p.name;
                showEvolve.usedPoints = 0;
                setShowEvolve(null);
                setTeam([...team]);
              }}
            >
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
