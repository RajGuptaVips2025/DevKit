"use client"

import React from 'react'
import { ToastContainer, toast } from 'react-toastify';

const Providers = ({children}: { children: React.ReactNode }) => {
  return (
    <>
    <ToastContainer position="top-right" autoClose={3000} />
    {children}
    </>
  )
}

export default Providers