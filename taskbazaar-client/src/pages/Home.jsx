import React from 'react';
import { services } from '../data/services';
import { motion } from 'framer-motion';

export default function App() {
  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navbar */}
      <header className="flex justify-between items-center px-6 py-4 shadow-md">
        <h1 className="text-2xl font-bold text-indigo-600">TaskBazaar</h1>
        <nav className="space-x-4">
          <a href="#hero" className="text-gray-700 hover:text-indigo-600">Home</a>
          <a href="#services" className="text-gray-700 hover:text-indigo-600">Services</a>
          <a href="/login" className="text-gray-700 hover:text-indigo-600">Login</a>
          <a href="/register" className="text-gray-700 hover:text-indigo-600">Register</a>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className="flex flex-col items-center text-center py-20 px-4 bg-gray-50">
        <motion.h2
          className="text-4xl md:text-5xl font-bold mb-4"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Connect with Local Service Providers
        </motion.h2>
        <motion.p
          className="text-lg max-w-xl text-gray-600 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          Find trusted professionals for tasks around your home or business easily.
        </motion.p>
        <motion.a
  href="/register"
  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition inline-block"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  Get Started
</motion.a>

      </section>

      {/* Services Section */}
      <section id="services" className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-semibold text-center mb-8">Our Services</h3>
          <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
            {services.map((s, index) => (
              <motion.div
                key={s.id}
                className="bg-gray-50 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
              >
                <img src={s.img} alt={s.name} className="w-full h-40 object-cover" />
                <div className="p-4 text-center">
                  <h4 className="text-xl font-medium mb-2">{s.name}</h4>
                  <a href={s.link} className="text-indigo-600 hover:underline">Learn More</a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-6 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} TaskBazaar. All rights reserved.
      </footer>
    </div>
  );
}
