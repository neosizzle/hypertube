import { motion } from "motion/react";

type ModalProps = {
  open: boolean
  children: React.ReactNode;
}

export default function Modal({open, children}: ModalProps) {
  return (
    <motion.div className={`fixed z-10 inset-0 flex justify-center items-center transition-colors bg-black/50`}
    initial={{ opacity: 0 }}
    animate={open ? {
      opacity: 1,
      display: "block",
      visibility: "visible"
    } : {
      opacity: 0,
      transitionEnd: {
        display: "none",
        visibility: "hidden"
      }
    }}
    transition={{ duration: 0.2 }}>
      {children}
    </motion.div>
  )
}