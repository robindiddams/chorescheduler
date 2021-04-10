import React, { useState } from "react";
import "./App.css";
import {
  Assignment,
  Meal,
  assignAllChores,
  makeChoreChart,
  toShortDate,
} from "./schduler";

const SailorInput = (props: {
  index: number;
  value: string;
  onTextChange: (text: string, index: number) => void;
  onDelete?: (index: number) => void;
  onReturn?: (index: number) => void;
}) => (
  <div className="prompt">
    <input
      className="promptInput"
      placeholder="sailor"
      onChange={(event) => props.onTextChange(event.target.value, props.index)}
      onKeyDown={(event) =>
        event.key === "Enter" && props.onReturn?.(props.index)
      }
      value={props.value}
    />
    <button onClick={() => props.onDelete?.(props.index)}>X</button>
  </div>
);

const ScheduleView = (props: { assignments: Assignment[] }) => {
  const { assignments } = props;
  if (!assignments.length) {
    return <></>;
  }

  const writeDates = () => {
    const dateMap = assignments.reduce(
      (dates, a) => dates.set(a.day, a.date),
      new Map<number, Date>()
    );
    const tds = [<td>Dates</td>];
    for (let i = 0; i < dateMap.size; i++) {
      const date = dateMap.get(i);
      if (date) {
        tds.push(<td>{toShortDate(date)}</td>);
      }
    }
    return <tr>{tds}</tr>;
  };
  const writeType = (type: Meal) => {
    const rowdata = assignments
      .filter((a) => a.type === type)
      .sort((a, b) => a.day - b.day)
      .map((a) => a.workers);
    const tds = [<td>{type.toString()}</td>];
    tds.push(
      ...rowdata.map((a) => {
        return <td>{a.join("\n")}</td>;
      })
    );
    return <tr>{tds}</tr>;
  };

  return (
    <div>
      <table>
        <tbody>
          {writeDates()}
          {writeType(Meal.BREAKFAST)}
          {writeType(Meal.LUNCH)}
          {writeType(Meal.HAPPYHOUR)}
          {writeType(Meal.DINNER)}
        </tbody>
      </table>
      <a
        download="choreSchedule.csv"
        href={`data:application/octet-stream,${encodeURIComponent(
          makeChoreChart(assignments)
        )}`}
      >
        Download Spreadsheet
      </a>
    </div>
  );
};

function App() {
  const [sailors, setSailors] = useState<string[]>([""]);
  const [daysAtSea, setDaysAtSea] = useState(8);
  const [startDate, setStartDate] = useState(new Date());
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const addSailor = () => setSailors((current) => current.concat(""));

  const updateSailorName = (newName: string, index: number) => {
    setSailors((current) => {
      const newList = [...current];
      newList[index] = newName;
      return newList;
    });
  };

  const removeSailor = (index: number) =>
    setSailors((current) => current.filter((_, i) => i !== index));

  const scheduleSailors = () => {
    const assignments = assignAllChores(daysAtSea, startDate, sailors);
    setAssignments(assignments);
  };

  const errorTooShort =
    daysAtSea < 2 ? "must be at sea longer than 1 day!" : undefined;
  const errNotEnoughSailors =
    sailors.length < 7 ? "Requires at least 7 sailors!" : undefined;

  const invalidReason = errNotEnoughSailors || errorTooShort;
  const invalid = !!invalidReason;
  const summary = `${sailors.length} sailors to schedule over ${daysAtSea} days`;

  return (
    <div className="App">
      <header className="App-header">
        <div>⚓️ Sailor Scheduler 🛥</div>
        <br />
        <span>Sailors:</span>
        {sailors.map((sailor, i) => (
          <SailorInput
            key={i}
            index={i}
            onTextChange={updateSailorName}
            onReturn={addSailor}
            value={sailor}
            onDelete={removeSailor}
          />
        ))}
        <button onClick={addSailor}>Add Sailor</button>
        <div>
          <span>Days at Sea:</span>
          <input
            type="number"
            // className="promptInput"
            placeholder="Days At Sea"
            onChange={(event) => setDaysAtSea(Number(event.target.value))}
            value={daysAtSea}
          />
        </div>
        <div>
          <span>Fist day:</span>
          <input
            type="date"
            id="start"
            name="trip-start"
            value={`${startDate.toISOString().split("T")[0]}`}
            onChange={(event) => {
              console.log(event.target.value);
              setStartDate(
                new Date(
                  event.target.value +
                    "T" +
                    new Date().toISOString().split("T")[1] // add the time 🙄
                )
              );
            }}
          />
        </div>
        <span>{invalid ? invalidReason : summary}</span>
        <button disabled={invalid} onClick={scheduleSailors}>
          Schedule!
        </button>
        <ScheduleView assignments={assignments} />
      </header>
    </div>
  );
}

export default App;
