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
  normal: "#bdc3c7",
  fighting: "#cb5f48",
  flying: "#95a5a6",
  poison: "#9b59b6",
  ground: "#a0522d",
  rock: "#8e6e53",
  bug: "#94bc4a",
  ghost: "#6c5ce7",
  steel: "#7f8c8d"
};

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);
  const [pokemonList, setPokemonList] = useState([]);
  const [points, setPoints] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=50")
      .then(res => res.json())
      .then(data => setPokemonList(data.results))
      .catch(() => console.log("API Fehler"));
  }, []);

  const catchPokemon = async (pokemon) => {
    try {
      const res = await fetch(pokemon.url);
      const data = await res.json();

      const type = data.types?.[0]?.type?.name || "normal";

      const newPokemon = {
        id: Date.now(),
        name: data.name,
        nickname: data.name,
        sprite: data.sprites?.front_default,
        type,
        color: typeColors[type] || "gray"
      };

      setBox(prev => [...prev, newPokemon]);
    } catch (e) {
      console.log("Fehler beim Laden");
    }
  };

  const moveToTeam = (p) => {
    if (team.length >= 6) return;
    setTeam(prev => [...prev, p]);
    setBox(prev => prev.filter(x => x.id !== p.id));
  };

  const placeOnGrid = (index) => {
    if (!selected || grid[index]) return;

    const newGrid = [...grid];
    newGrid[index] = selected;
    setGrid(newGrid);
  };

  const addPoint = () => {
    if (points >= 3) return;
    setPoints(points + 1);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid Challenge</h1>

      <h2>Punkte: {points}</h2>
      <button onClick={addPoint}>+ Punkt</button>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 80px)",
        gap: 5,
        marginTop: 20
      }}>
        {grid.map((cell, i) => (
          <div
            key={i}
            onClick={() => placeOnGrid(i)}
            style={{
              width: 80,
              height: 80,
              border: "1px solid black",
              background: cell ? cell.color : "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
          >
            {cell && cell.sprite && (
              <img src={cell.sprite} width={50} />
            )}
          </div>
        ))}
      </div>

      <h2>Team (klicken zum Auswählen)</h2>
      {team.map((p) => (
        <div key={p.id} onClick={() => setSelected(p)} style={{ cursor: "pointer" }}>
          <img src={p.sprite} width={40} />
          <span style={{ marginLeft: 10 }}>{p.nickname}</span>
        </div>
      ))}

      <h2>Box</h2>
      {box.map((p) => (
        <div key={p.id}>
          <img src={p.sprite} width={40} />
          <span>{p.name}</span>
          <button onClick={() => moveToTeam(p)}>To Team</button>
        </div>
      ))}

      <h2>Catch Pokemon</h2>
      {pokemonList.map((p) => (
        <button key={p.name} onClick={() => catchPokemon(p)}>
          {p.name}
        </button>
      ))}
    </div>
  );
}
