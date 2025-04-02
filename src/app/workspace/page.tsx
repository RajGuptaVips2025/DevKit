"use client"

import React from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";

function Page() {
  return (
    <div>
      <div className='bg-[#181818] w-full p-2 border'>
        <div className='flex items-center flex-wrap shrink-0 bg-black p-1 justify-center w-[140px] gap-3'>
          <h2 className={`text-sm cursor-pointer text-white`}>Code</h2>
          <h2 className={`text-sm cursor-pointer text-white`}>Preview</h2>
        </div>
      </div>
      <SandpackProvider theme={'dark'} template="react">
        <SandpackLayout>
          <SandpackFileExplorer style={{height: '100vh'}} />
          <SandpackCodeEditor style={{height: '100vh'}} />
          <SandpackPreview style={{height: '100vh'}} />
        </SandpackLayout>
      </SandpackProvider>
    </div>
  )
}

export default Page