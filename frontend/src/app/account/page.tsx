"use client"

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Modal from '@/components/modal';
import { motion } from "motion/react";
import Image from "next/image"
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LocaleSelector from "@/components/LocaleSelector";
import DimensionSelector from "../../components/DimensionSelector";

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

function formatJSONKey(key : string) {
  return key.split('_').map((s : string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
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
    if (username === confirmUsername && declaration === 'delete my account') {
      setEnableDelete(true)
    } else {
      setEnableDelete(false)
    }
  }, [confirmUsername, declaration, username])

  const deleteAccount = () => {

    fetch('http://localhost:8000/api/users/me', {
      method: 'DELETE',
      credentials: 'include',
    }).then((response) => {
      if (response.ok) {
        router.push('/browse')
      }
      else {
        router.push('/login')
      }
    }).catch(() => {
      router.push('/error')
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
            <div className="text-black font-bold">To verify, type &#39;delete my account&#39; below:</div>
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

  const c = useTranslations('Common')
  const t = useTranslations('AccountPage')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [lastName, setLastName] = useState('')
  const [firstName, setFirstName] = useState('')
  const [profilePicURL, setProfilePicURL] = useState('')
  const [isEdit, setEdit] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
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
    const fileUpload = document.createElement('input')
    fileUpload.type = 'file';

    fileUpload.onchange = (event) => {
    
      const target = event.target as HTMLInputElement;
      if (!target || !target.files)
        return

      const file = target.files[0]

      if (file.size >= 10 * 1024 * 1024)
      {
        alert('Image size must be less than 10mb')
        return
      }

      const formData = new FormData()
      formData.append('image', file)

      fetch('http://localhost:8000/api/users/picture', {
        method: 'POST',
        credentials: 'include',
        body: formData
      }).then((response) => {
        if (response.ok) response.json().then((data) => setProfilePicURL(data.detail))
        else if (response.status == 400)
          response.json().then((data) => alert(data))
        else
          router.push('/login')
      }).catch(() => {
        router.push('/error')
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
      else if (response.status == 400)
        response.json().then((data) => alert(data))
      else
        router.push('/login')
    }).catch(() => {
      router.push("/error")
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
        setErrorMsg('')
        setTimeout(() => setUpdateSuccess(false), 5000)
      } else {
        response.json().then((obj) => {
          const key = Object.keys(obj)[0]
          const msg = (obj[key][0].includes('unique') ? formatJSONKey(key) + ' is already taken.' : obj[key][0])
          setErrorMsg(formatJSONKey(key) + ": " + msg)
        })
      }
    }).catch(() => {
      router.push('/error')
    })
  }

  return (
    <div className="h-auto w-full bg-white flex flex-col justify-between">
      <Header />
      <div className="flex flex-col justify-center py-10 px-8 lg:px-16 grow mb-auto space-y-4">
        <div className="text-black text-4xl bg-clip-text font-bold">{t('account')}</div>
        <hr className="w-full h-1 bg-gradient-to-r from-purple-200 to-[#9EFCFF] bg-clip-border my-4 rounded-md" />
        <div className="flex flex-col space-y-4">
          <div className="text-black text-xl font-medium px-2 lg:px-0">{t('profileDetails')}</div>
          <div className="flex flex-col md:flex-row items-center lg:items-start lg:justify-start md:space-x-8">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-1">
                <div className="text-black font-bold">{c('username')}</div>
                <input className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2 
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={username} onInput={(e) => setUsername(e.currentTarget.value)}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">{c('email')}</div>
                <input className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={email} onInput={(e) => setEmail(e.currentTarget.value)}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">{c('firstName')}</div>
                <input className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={firstName} onInput={(e) => setFirstName(e.currentTarget.value)}/>
              </div>
              <div className="space-y-1">
                <div className="text-black font-bold">{c('lastName')}</div>
                <input className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2
                text-black text-xs lg:text-base border border-slate-400"
                defaultValue={lastName} onInput={(e) => setLastName(e.currentTarget.value)}/>
              </div>
              {errorMsg !== '' && <motion.div className="flex justify-center items-center text-red-500 text-[0.6rem] lg:text-sm"
                initial={exit}
                animate={enter}>
                  {errorMsg}
              </motion.div>}
              <button className={`w-72 lg:w-48 h-8 lg:h-10 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all ${updateSuccess ?'bg-green-400 text-black' : 'bg-purple-400'}`}
              onClick={updateProfile}>{updateSuccess ? t('success') : t('updateProfile')}</button>
            </div>
            <div className="flex flex-col relative space-y-5 p-5 md:p-0 items-center">
              <div className="text-black font-bold justify-start">{t('profilePicture')}</div>
              <Image src={`http://localhost:8000${profilePicURL}`} alt="profile picture" width={150} height={150} 
              className="rounded-full w-32 h-32"/>
              <button className="w-16 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
              hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => setEdit(!isEdit)}>{t('edit')}</button>
              <motion.div
                initial={exit}
                animate={isEdit ? enter : exit}
                className="absolute top-56 bg-white rounded-lg text-black z-10">
                  <ul className="p-4 space-y-4 border-2 rounded-lg w-44">
                    <li className="hover:text-gray-500 cursor-pointer" onClick={deleteImage}>{t('removePicture')}</li>
                    <li className="hover:text-gray-500 cursor-pointer" onClick={uploadImage}>{t('uploadNew')}</li>
                  </ul>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="flex flex-col space-y-4 px-2 lg:px-0">
          <div className="text-black text-xl font-medium">{t('language')}</div>
          <LocaleSelector className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
          border border-slate-400 items-center px-2 bg-transparent hover:bg-black/10 outline-none" />
        </div>
        <div className="flex flex-col space-y-4 px-2 lg:px-0">
          <div className="text-black text-xl font-medium">{t('vidResolution')}</div>
          <DimensionSelector className="w-72 lg:w-96 h-8 lg:h-12 bg-white rounded-lg p-2 text-black text-xs lg:text-base
          border border-slate-400 items-center px-2 bg-transparent hover:bg-black/10 outline-none" />
        </div>
        <div className="flex flex-col space-y-4 px-2 lg:px-0">
          {/* TODO: change button based on auth method*/}
          <div className="text-black text-xl font-medium">{t('passwordAndAuthentication')}</div>
          <button className="w-fit px-5 h-8 lg:h-10 bg-purple-400 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
                  hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {router.push('/reset')}}>{t('resetPassword')}</button>
        </div>
        <div className="flex flex-col space-y-4 px-2 lg:px-0">
          <div className="text-black text-xl font-medium">{t('accountSettings')}</div>
          <button className="w-48 h-8 lg:h-10 bg-red-500 rounded-lg p-1 font-medium font-white text-sm lg:text-lg
                  hover:scale-105 hover:drop-shadow-sm transition-all" onClick={() => {setIsDeleteModalOpen(true)}}>{t('deleteAccount')}</button>
        </div>
      </div>
      <DeleteAccountConfirmationModal open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} />
      <Footer />
    </div>
  )
}