import "./Cards.css";
import { Link } from "react-router-dom";

function Cards(props) {
  return (
    <Link className="card" to={`/AboutTopics/${encodeURIComponent(props.cardTitle)}`}>
      <h2>{props.cardTitle}</h2>
      <p>{props.cardDescription}</p>
      <span className="card-button">View details <span aria-hidden="true">→</span></span>
    </Link>
  );
}

export default Cards;
