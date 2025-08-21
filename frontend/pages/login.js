import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';


export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/user/login`, form, {
        withCredentials: true,
      });
      setMessage('Login successful!');
      router.push('/');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Login failed');
    }
  };


    /*
  return (
    
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm space-y-4">
        <h2 className="text-xl font-bold text-center">Login</h2>
        <input
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <input
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          className="w-full border p-2 rounded"
          required
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Login
        </button>
        {message && <p className="text-center text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );*/

  return (
    <div className="flex h-screen bg-yellow-50">
      <div className="w-full max-w-xs m-auto bg-yellow-50 rounded p-5">
        <header>
          <img className="w-100 mx-auto mb-5" src="https://i.imgur.com/ePscwjI.png" />
        </header>
        <form onSubmit={handleSubmit}>
              <div>
                <label className="block mb-2 text-green-800">Email</label>
                <input
                  name="email"
                  placeholder="Email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:border-green-800 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 mt-3 text-green-800">Password</label>
                <input
                  name="password"
                  placeholder="Password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border p-2 rounded focus:border-green-800 outline-none"
                  required
                />
              </div>
              <div>          
                <button class="w-full bg-green-900 hover:bg-green-800 text-white py-2 px-4 mt-6 rounded" type="submit">
                  Enviar
                </button> 
                {message && <p className="text-center text-sm text-gray-600">{message}</p>}
              </div>       
            </form>  
           
          </div>
    </div>
  );
}
