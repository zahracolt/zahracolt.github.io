import {formatISO9075} from "date-fns";
import { Link } from 'react-router-dom';

export default function Post({ _id, title, summary, cover, content, createdAt, updatedAt, author }) {
  return (
    <div className="post">
      <div className="image">
        <Link to={`/post/${_id}`}>
          <img src={'http://localhost:4000/' + cover} alt="" />
        </Link>
      </div>
      <div className="texts">
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className="info">
          by<a href=" " className="author">{author?.username}</a>
          <time>Created: {formatISO9075(new Date(createdAt))}</time>
          {updatedAt && <span>Last updated: {formatISO9075(new Date(updatedAt))}</span>}
        </p>
        <p className="summary">{summary}</p>
      </div>
    </div>
  );
}
