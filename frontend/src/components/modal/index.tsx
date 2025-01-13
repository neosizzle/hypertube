import { motion } from "motion/react";

type ModalProps = {
  open: boolean
  children: React.ReactNode;
}

const enter: any = {
  opacity: 1,
  display: "block",
  visibility: "visible"
}

const exit: any = {
  opacity: 0,
  transitionEnd: {
    display: "none",
    visibility: "hidden"
  }
}

export default function Modal({open, children}: ModalProps) {
  return (
    <motion.div className={`fixed z-10 inset-0 flex justify-center items-center transition-colors bg-black/50`}
    initial={exit} animate={open ? enter : exit}
    transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  )
}