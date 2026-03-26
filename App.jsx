import { useState } from "react";

const emptyGrid = Array(9).fill(null);

export default function App() {
  const [grid, setGrid] = useState(emptyGrid);
  const [points, setPoints] = useState(3);
  const [team, setTeam] = useState([]);
  const [box, setBox] = useState([]);

  const addPokemon = () => {
    const newPokemon = {
      id: Date.now(),
      name: "New Pokemon",
      nickname: "",
      color: "red",
      pattern: [0],
    };
    setBox([...box, newPokemon]);
  };

  const moveToTeam = (pokemon) => {
    if (team.length >= 6) return;
    setTeam([...team, pokemon]);
    setBox(box.filter((p) => p.id !== pokemon.id));
  };

  const placeOnGrid = (pokemon, index) => {
    const newGrid = [...grid];
    if (newGrid[index]) return;
    newGrid[index] = pokemon.id;
    setGrid(newGrid);
  };

  const changeColor = (pokemon) => {
    if (points < 2) return;
    pokemon.color = pokemon.color === "red" ? "blue" : "red";
    setPoints(points - 2);
    setTeam([...team]);
  };

  const changePattern = (pokemon) => {
    if (points < 1) return;
    pokemon.pattern = [Math.floor(Math.random() * 9)];
    setPoints(points - 1);
    setTeam([...team]);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Pokemon Grid Challenge</h1>
      <p>Points: {points}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 60px)", gap: 5 }}>
        {grid.map((cell, i) => (
          <div key={i} style={{ width: 60, height: 60, border: "1px solid black", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {cell ? "P" : ""}
          </div>
        ))}
      </div>

      <h2>Team</h2>
      {team.map((p) => (
        <div key={p.id}>
          <span style={{ color: p.color }}>{p.nickname || p.name}</span>
          <button onClick={() => changeColor(p)}>Color</button>
          <button onClick={() => changePattern(p)}>Pattern</button>
        </div>
      ))}

      <h2>Box</h2>
      {box.map((p) => (
        <div key={p.id}>
          <span>{p.name}</span>
          <button onClick={() => moveToTeam(p)}>To Team</button>
        </div>
      ))}

      <button onClick={addPokemon}>Catch Pokemon</button>
    </div>
  );
}
