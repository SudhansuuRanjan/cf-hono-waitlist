import { useEffect, useState } from "react";

const TotalSubscribers = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch("/api/subscriber-count")
      .then((res) => res.json())
      .then((data) => {
        setCount(data.total);
      });
  }, []);
  return (
    <>
      {count && (
        <div className="text-neutral-content text-sm">
          Join{" "}
          <span className="font-semibold text-shadow-green-500">{count}</span>{" "}
          other developers! 🚀
        </div>
      )}
    </>
  );
};

export default TotalSubscribers;
