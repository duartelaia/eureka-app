import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Navbar from './navbar';
import Body from './body';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/user/me`, { withCredentials: true })
      .then(res => {
        if (res.data.user) {
          setUser(res.data.user);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => {
        router.replace('/login');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/logout`, {}, { withCredentials: true });
    setUser(null);
    router.replace('/login');
  };

  if (loading) {
    return <p className="text-center mt-10">Loading...</p>;
  }

  if (!user) {
    return null; // Redirecting
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl">
        <Navbar user={user} onLogout={handleLogout} />
        <Body user={user} />
      </div>
    </div>
  );
}