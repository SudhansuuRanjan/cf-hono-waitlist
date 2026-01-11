import { useEffect, useState } from "react"

export const ServerStatus = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch('/api/health')
    .then(res => res.json())
    .then(data => {
      setStatus(data.status)
      setLoading(false);
    })
  }, [])

  return (
    <div className="mb-4 flex gap-2 items-center m-auto justify-center">
      <h1 className="text-lg text-center">Server Status : </h1>
      <p className="text-center text-green-500">
        {loading ? 'Checking...' : status}
      </p>
    </div>
  )
}