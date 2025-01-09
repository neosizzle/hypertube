"use client"

import Footer from "@/components/footer";
import Header from "@/components/header";
import Modal from '@/components/modal';
import { motion } from "motion/react";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";

const enter = {
  opacity: 1,
  transition: {
    duration: 0.2
  },
  display: "block"
}

const exit = {
  opacity: 0,
  transition: {
    duration: 0.2
  },
  transitionEnd: {
    display: "none"
  }
}

function DeleteAccountConfirmationModal({ open, onClose }: { open: boolean, onClose: () => void }) {

  const [username, setUsername] = useState('')
  const [declaration, setDeclaration] = useState('')
  const [confirmUsername, setConfirmUsername] = useState('')
  const [enableDelete, setEnableDelete] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) data.json().then((json) => setUsername(json.username))
    })
  }, [])

  useEffect(() => {
    (username === confirmUsername && declaration === 'delete my account') ? setEnableDelete(true) : setEnableDelete(false)
  }, [confirmUsername, declaration])

  const deleteAccount = () => {

    fetch('http://localhost:8000/api/users/me', {
      method: 'DELETE',
      credentials: 'include',
    }).then((response) => {
      if (response.ok) {
        router.push('/browse')
      }
    }).catch((error) => {
      console.error(error);
    })
  }

  return (
    <Modal open={open}>
      <div className="flex h-full justify-center items-center">
        <div className="flex flex-col w-96 h-auto bg-white rounded-lg p-8 space-y-4">
          <div className="text-black font-bold text-2xl">Are you sure?</div>
          <div className="text-black text-lg">This account will be permanently deleted and all data will be erased immediately.</div>
          <div className="text-black text-lg">To confirm this action, please type the following:</div>
          <div className="space-y-1">
            <div className="text-black font-bold">Username:</div>
            <input className="w-full h-8 lg:h-12 bg-white rounded-lg p-2 
            text-black text-xs lg:text-base border border-slate-400"
            onInput={(e) => setConfirmUsername(e.currentTarget.value)}
            onPaste={(e) => e.preventDefault()}/>
          </div>
          <div className="space-y-1">
            <div className="text-black font-bold">To verify, type 'delete my account' below:</div>
            <input className="w-full h-8 lg:h-12 bg-white rounded-lg p-2 
            text-black text-xs lg:text-base border border-slate-400"
            onInput={(e) => setDeclaration(e.currentTarget.value)}
            onPaste={(e) => e.preventDefault()}/>
          </div>
          <div className="flex flex-row space-x-4 justify-center items-center">
            <button className="w-24 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={onClose}>Cancel</button>
            <button className={`w-24 h-8 lg:h-10 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              transition-all ${enableDelete ?'bg-red-500 hover:scale-105 hover:drop-shadow-sm' : 'bg-[#FFC0CB]'}`}
              disabled={!enableDelete} onClick={deleteAccount}>Confirm</button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Account() {

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [profilePicURL, setProfilePicURL] = useState('')

  const [isEdit, setEdit] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch(`http://localhost:8000/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    }).then((data) => {
      if (data.ok) {
        data.json().then((json) => {
          setUsername(json.username)
          setEmail(json.email)
          setFirstName(json.first_name)
          setLastName(json.last_name)
          setProfilePicURL(json.profile_picture)
        })
      }
    })
  }, [])

  const uploadImage = () => {
    let fileUpload = document.createElement('input')
    fileUpload.type = 'file';

    fileUpload.onchange = (event) => {
    
      let target = event.target as HTMLInputElement;
      if (!target || !target.files)
        return

      let file = target.files[0]

      if (file.size >= 10 * 1024 * 1024)
      {
        alert('Image size must be less than 10mb')
        return
      }

      let formData = new FormData()
      formData.append('image', file)

      fetch('http://localhost:8000/api/users/picture', {
        method: 'POST',
        credentials: 'include',
        body: formData
      }).then((response) => {
        if (response.ok) response.json().then((data) => setProfilePicURL(data.detail))
      }).catch((error) => {
        console.error(error);
      })
    }

    fileUpload.click()
  }

  const deleteImage = () => {
    fetch('http://localhost:8000/api/users/picture', {
      method: 'DELETE',
      credentials: 'include',
    }).then((response) => {
      if (response.ok) response.json().then((data) => setProfilePicURL(data.detail))
    }).catch((error) => {
      console.error(error);
    })
  }

  const updateProfile = () => {

    const requestBody: { username?: string, email?: string, first_name?: string, last_name?: string } = {};
    if (username) requestBody.username = username;
    if (email) requestBody.email = email;
    if (firstName) requestBody.first_name = firstName
    if (lastName) requestBody.last_name = lastName;

    fetch('http://localhost:8000/api/users/me', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    }).then((response) => {
      if (response.ok) {
        setUpdateSuccess(true)
        setTimeout(() => setUpdateSuccess(false), 5000)
      }
    }).catch((error) => {
      console.error(error);
    })
  }

  return (
    <div className="h-screen w-screen bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center py-10 px-16 grow mb-auto border-2 space-y-4">
        <div className="text-black text-4xl bg-clip-text font-bold">Account</div>
        <hr className="w-full h-1 bg-gradient-to-r from-purple-200 to-[#9EFCFF] bg-clip-border my-4 rounded-md" />
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium ">Profile Details</div>
          <div className="flex flex-row justify-start space-x-8">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-1">
                <div className="text-black font-bold">Username</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2 
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={username} onInput={(e) => setUsername(e.currentTarget.value)}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">Email</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={email} onInput={(e) => setEmail(e.currentTarget.value)}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">First Name</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={firstName} onInput={(e) => setFirstName(e.currentTarget.value)}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">Last Name</div>
                <input className="w-96 h-8 lg:h-12 bg-white rounded-lg p-2
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={lastName} onInput={(e) => setLastName(e.currentTarget.value)}/>
              </div>
              <button className={`w-48 h-8 lg:h-10 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all ${updateSuccess ?'bg-green-400 text-black' : 'bg-purple-400'}`}
              onClick={updateProfile}>{updateSuccess ? 'Success!' : 'Update Profile'}</button>
            </div>
            <div className="flex flex-col items-center relative space-y-5">
              <div className="text-black font-bold justify-start">Profile Picture</div>
              <Image src={`http://localhost:8000${profilePicURL}`} alt="profile picture" width={150} height={150} 
              className="rounded-full w-32 h-32"/>
              <button className="w-16 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => setEdit(!isEdit)}>Edit</button>
              <motion.div
                initial={exit}
                animate={isEdit ? enter : exit}
                className="absolute top-56 bg-white rounded-lg text-black z-10">
                  <ul className="p-4 space-y-4 border-2 rounded-lg w-44">
                    <li className="hover:text-gray-500 cursor-pointer" onClick={deleteImage}>Remove Picture</li>
                    <li className="hover:text-gray-500 cursor-pointer" onClick={uploadImage}>Upload new...</li>
                  </ul>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4">
          {/* TODO: change button based on auth method*/}
          <div className="text-black text-xl font-medium">Password and Authentication</div>
          <button className="w-48 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
                  hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/reset')}}>Reset Password</button>
        </div>
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium">Account Settings</div>
          <button className="w-48 h-8 lg:h-10 bg-red-500 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
                  hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {setIsOpen(true)}}>Delete Account</button>
        </div>
      </div>
      <DeleteAccountConfirmationModal open={isOpen} onClose={() => setIsOpen(false)} />
      <Footer />
    </div>
  )
}