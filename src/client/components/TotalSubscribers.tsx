import { useEffect, useState } from "react";
import { set } from "zod";

const TotalSubscribers = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/subscriber-count")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        setCount(data.total);
      });
  }, []);
  return (
    <>
      {loading ? (
        <div className="text-neutral-content text-sm">
          Loading subscriber count...
        </div>
      ) : count > 0 ? (
        <div className="text-neutral-content text-sm">
          Join <span className="font-semibold text-accent">{count}</span>{" "}
          other developers! 🚀
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default TotalSubscribers;
