import { useState } from "react";

export default function Navbar({ user, onLogout }) {

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#95B899] py-2.5">
        <div className="flex flex-wrap items-center justify-between max-w-screen-xl px-4 mx-auto">
            <a href="#" className="flex items-center">
                <img className="w-8 mr-1 mx-auto" src="https://i.imgur.com/FSMVCsh.png" />
                <span className="self-center text-xl font-semibold whitespace-nowrap text-white">Eureka</span>
            </a>
            <div className="flex items-center lg:order-2">
                <div className="hidden mr-4 sm:center lg:flex lg:items-center lg:gap-4">
                    <span className="self-center text-l whitespace-nowrap text-white">Welcome, <strong>{user.name}</strong></span>
                </div>

                <button
                    onClick={onLogout}
                    className="text-white bg-[#00622C] hover:bg-green-900 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-4 lg:px-5 py-2 lg:py-2.5 sm:mr-2 lg:mr-0">Logout</button>

                {user.role === "admin" && (
                  <button data-collapse-toggle="mobile-menu-2" type="button"
                      className="inline-flex items-center p-2 ml-1 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                      aria-controls="mobile-menu-2" 
                      aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((open) => !open)}
                      >
                      
                        <span className="sr-only">Open main menu</span>
                        <svg className={`${menuOpen ? "hidden" : "block"} w-6 h-6`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd"
                            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                            clip-rule="evenodd"></path>
                        </svg>
                        <svg className={`${menuOpen ? "block" : "hidden"} w-6 h-6`} fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fill-rule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clip-rule="evenodd"></path>
                        </svg>
                    </button>
                  )}
              </div>
              <div className={`items-center justify-between w-full lg:flex lg:w-auto lg:order-1 ${menuOpen ? "" : "hidden"}`} id="mobile-menu-2">
                  {user.role === "admin" && (
                    <ul className="flex flex-col mt-4 font-medium lg:flex-row lg:space-x-8 lg:mt-0">
                      <li>
                        <a href="#"
                          className="block py-2 pl-3 pr-4 text-white bg-green-700 rounded lg:bg-transparent lg:text-green-900 lg:p-0"
                          aria-current="page">Calendários</a>
                      </li>
                      <li>
                        <a href="#"
                          className="block py-2 pl-3 pr-4 text-yellow-50 border-b lg:hover:bg-transparent lg:border-0 lg:hover:text-green-900 lg:p-0">Funcionários</a>
                      </li>
                      <li>
                        <a href="#"
                          className="block py-2 pl-3 pr-4 text-yellow-50 border-b lg:hover:bg-transparent lg:border-0 lg:hover:text-green-900 lg:p-0">Estatísticas</a>
                      </li>
                    </ul>
                  )}
          </div>
        </div>
      </nav>

  );
}


