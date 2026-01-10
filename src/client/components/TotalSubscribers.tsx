import { useEffect, useState } from "react";

const TotalSubscribers = () => {
  const [count, setCount] = useState("");

  useEffect(() => {
    fetch("/api/subscriber-count")
      .then((res) => res.json())
      .then((data) => {
        setCount(data.total);
      });
  }, []);
  return (
    <div className="text-neutral-content text-sm">Join {count} other developers! 🚀</div>
  );
};

export default TotalSubscribers;
