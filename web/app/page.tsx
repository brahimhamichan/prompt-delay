/**
 * from Paper
 * https://app.paper.design/file/01KN3QGZ2REZDFZ3FZCNWXEANN?node=F18-0
 * on Apr 4, 2026
 */
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Stepper } from "pasito";

import { ClaudeSpinner } from "./claude-spinner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STAR_DOT_SIZE = 3;
const STAR_SPREAD = 5.5;
const STAR_CELL_SIZE = STAR_DOT_SIZE + STAR_SPREAD * 2;
const STAR_CENTER = STAR_CELL_SIZE / 2 - STAR_DOT_SIZE / 2;

const STAR_DOTS = [
  { x: STAR_CENTER, y: 0, delay: 0, duration: 1400 },
  { x: STAR_CENTER * 2, y: STAR_CENTER, delay: 300, duration: 1700 },
  { x: STAR_CENTER, y: STAR_CENTER * 2, delay: 700, duration: 1500 },
  { x: 0, y: STAR_CENTER, delay: 1000, duration: 1600 },
  { x: STAR_CENTER, y: STAR_CENTER, delay: 500, duration: 2200 },
];

function StarDots() {
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        width: `${STAR_CELL_SIZE}px`,
        height: `${STAR_CELL_SIZE}px`,
        flexShrink: 0,
      }}
    >
      {STAR_DOTS.map((dot, index) => {
        const isCenter = index === 4;
        return (
          <span
            key={index}
            style={{
              position: "absolute",
              left: `${dot.x}px`,
              top: `${dot.y}px`,
              width: `${STAR_DOT_SIZE}px`,
              height: `${STAR_DOT_SIZE}px`,
              borderRadius: "50%",
              backgroundColor: "color(display-p3 0.930 0.513 0.112)",
              animation: isCenter
                ? `delay-dot-center ${dot.duration}ms ease-in-out infinite`
                : `delay-dot-orbit ${dot.duration}ms ease-in-out infinite`,
              animationDelay: `${dot.delay}ms`,
            }}
          />
        );
      })}
    </span>
  );
}

interface AnimationConfig {
  codingDuration: number;
  slideDelay: number;
  diffDuration: number;
  cursorAppearDelay: number;
  cursorMoveDelay: number;
  cursorClickDelay: number;
  focusDelay: number;
  cursorAlertDelay: number;
  fixingDelay: number;
  fixDiffDelay: number;
  reloadDelay: number;
  reloadDuration: number;
  resetDelay: number;
  loopDelay: number;
  terminalScrollDuration: number;
  cursorMoveDuration: number;
  cursorEntranceStiffness: number;
  cursorEntranceDamping: number;
  cursorEntranceMass: number;
  browserSpringStiffness: number;
  browserSpringDamping: number;
  browserSpringMass: number;
  terminalSpringStiffness: number;
  terminalSpringDamping: number;
  terminalSpringMass: number;
  clickDuration: number;
  labelDuration: number;
  colorTransitionDuration: number;
}

const DEFAULT_CONFIG: AnimationConfig = {
  codingDuration: 1150,
  slideDelay: 700,
  diffDuration: 2100,
  cursorAppearDelay: 0,
  cursorMoveDelay: 1250,
  cursorClickDelay: 550,
  focusDelay: 50,
  cursorAlertDelay: 1100,
  fixingDelay: 1400,
  fixDiffDelay: 1800,
  reloadDelay: 600,
  reloadDuration: 800,
  resetDelay: 2000,
  loopDelay: 400,
  terminalScrollDuration: 600,
  cursorMoveDuration: 400,
  cursorEntranceStiffness: 500,
  cursorEntranceDamping: 20,
  cursorEntranceMass: 400,
  browserSpringStiffness: 250,
  browserSpringDamping: 22,
  browserSpringMass: 600,
  terminalSpringStiffness: 120,
  terminalSpringDamping: 20,
  terminalSpringMass: 800,
  clickDuration: 100,
  labelDuration: 150,
  colorTransitionDuration: 300,
};

type AnimationPhase = "coding" | "diff" | "delay";
type CursorLabelState = "delay" | "security" | "alert" | "fixed";

function useAnimationPhase(config: AnimationConfig, onComplete: () => void) {
  const [phase, setPhase] = useState<AnimationPhase>("coding");
  const [slid, setSlid] = useState(false);
  const [focused, setFocused] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorOnBrowser, setCursorOnBrowser] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [labelVisible, setLabelVisible] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<CursorLabelState>("security");
  const [cursorOnTerminal, setCursorOnTerminal] = useState(false);
  const [clickingTerminal, setClickingTerminal] = useState(false);
  const [terminalFocused, setTerminalFocused] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixDiff, setFixDiff] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloadDone, setReloadDone] = useState(false);
  const [looping, setLooping] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  useEffect(() => {
    const c = config;

    const delayTime = c.codingDuration + c.diffDuration;
    const cursorAppearTime = delayTime + c.cursorAppearDelay;
    const cursorMoveTime = cursorAppearTime + c.cursorMoveDelay;
    const clickTime = cursorMoveTime + c.cursorClickDelay;
    const focusTime = clickTime + c.focusDelay;
    const alertTime = focusTime + c.cursorAlertDelay;

    const diffTimer = setTimeout(() => setPhase("diff"), c.codingDuration);
    const slideTimer = setTimeout(() => setSlid(true), c.codingDuration + c.slideDelay);
    const delayTimer = setTimeout(() => setPhase("delay"), delayTime);
    const cursorTimer = setTimeout(() => setCursorVisible(true), cursorAppearTime);
    const cursorMoveTimer = setTimeout(() => setCursorOnBrowser(true), cursorMoveTime);
    const clickTimer = setTimeout(() => setClicking(true), clickTime);
    const clickEndTimer = setTimeout(() => setClicking(false), clickTime + 100);
    const labelShowTimer = setTimeout(() => setLabelVisible(true), clickTime);
    const focusTimer = setTimeout(() => setFocused(true), focusTime);
    const alertTimer = setTimeout(() => setCursorLabel("alert"), alertTime);
    const fixingTime = alertTime + c.fixingDelay;
    const fixingTimer = setTimeout(() => {
      setFixing(true);
      setTerminalFocused(true);
      setFocused(false);
    }, fixingTime);
    const fixDiffTime = fixingTime + c.fixDiffDelay;
    const fixDiffTimer = setTimeout(() => {
      setFixDiff(true);
      setCursorLabel("fixed");
    }, fixDiffTime);
    const reloadTime = fixDiffTime + c.reloadDelay;
    const reloadTimer = setTimeout(() => setReloading(true), reloadTime);
    const reloadDoneTime = reloadTime + c.reloadDuration;
    const reloadDoneTimer = setTimeout(() => setReloadDone(true), reloadDoneTime);
    const resetTime = reloadDoneTime + c.resetDelay;
    const resetTimer = setTimeout(() => {
      setCursorVisible(false);
      setLabelVisible(false);
      setLooping(true);
      setSlid(false);
      setFocused(false);
      setTerminalFocused(false);
    }, resetTime);
    const loopTime = resetTime + c.loopDelay;
    const loopTimer = setTimeout(() => onCompleteRef.current(), loopTime);
    return () => {
      clearTimeout(diffTimer);
      clearTimeout(slideTimer);
      clearTimeout(delayTimer);
      clearTimeout(cursorTimer);
      clearTimeout(cursorMoveTimer);
      clearTimeout(clickTimer);
      clearTimeout(clickEndTimer);
      clearTimeout(labelShowTimer);
      clearTimeout(focusTimer);
      clearTimeout(alertTimer);
      clearTimeout(fixingTimer);
      clearTimeout(fixDiffTimer);
      clearTimeout(reloadTimer);
      clearTimeout(reloadDoneTimer);
      clearTimeout(resetTimer);
      clearTimeout(loopTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    slid,
    focused,
    cursorVisible,
    cursorOnBrowser,
    cursorOnTerminal,
    clicking,
    clickingTerminal,
    labelVisible,
    cursorLabel,
    terminalFocused,
    fixing,
    fixDiff,
    reloading,
    reloadDone,
    looping,
  };
}

function TerminalContent({
  phase,
  fixing,
  fixDiff,
  looping,
  config,
  cycle,
}: {
  phase: AnimationPhase;
  fixing: boolean;
  fixDiff: boolean;
  looping: boolean;
  config: AnimationConfig;
  cycle: number;
}) {
  const fullPrompt = "/wait 90m continue";
  const fullResponse = "Continuing from where we left off. I’ll keep working on the previous task now.";
  const [stage, setStage] = useState(0);
  const [typedCount, setTypedCount] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const typingDone = stage >= 1 && typedCount >= fullPrompt.length;
  const typedPrompt = fullPrompt.slice(0, typedCount);
  const typedResponse = fullResponse.slice(0, responseCount);

  useEffect(() => {
    setStage(0);
    setTypedCount(0);
    setResponseCount(0);
    const timer = window.setTimeout(() => setStage(1), 450);
    return () => window.clearTimeout(timer);
  }, [cycle]);

  useEffect(() => {
    if (stage !== 1) return;

    setTypedCount(0);
    const timer = window.setInterval(() => {
      setTypedCount((current) => {
        if (current >= fullPrompt.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 34);

    return () => window.clearInterval(timer);
  }, [stage, fullPrompt.length]);

  useEffect(() => {
    if (!typingDone || stage !== 1) return;
    const timer = window.setTimeout(() => setStage(2), 120);
    return () => window.clearTimeout(timer);
  }, [typingDone, stage]);

  useEffect(() => {
    if (stage !== 2) return;
    const timer = window.setTimeout(() => setStage(3), 900);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 3) return;

    setResponseCount(0);
    const timer = window.setInterval(() => {
      setResponseCount((current) => {
        if (current >= fullResponse.length) {
          window.clearInterval(timer);
          return current;
        }
        return current + 1;
      });
    }, 22);

    return () => window.clearInterval(timer);
  }, [stage, fullResponse.length]);

  return (
    <motion.div
      className="relative flex w-[31rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[18px] bg-white p-2.25 shadow-[0_3px_18px_rgba(18,34,54,0.08)]"
      initial={cycle > 0 ? { y: 14, opacity: 0.88 } : false}
      animate={{ y: stage >= 2 ? -8 : 0, opacity: 1 }}
      transition={{ duration: config.terminalScrollDuration / 1000, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="relative flex items-center justify-between pb-2.5">
        <div className="font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] text-[10.5px] font-bold uppercase tracking-[0.18em] text-[#50677f]">
          Codex
        </div>
      </div>

      <motion.div
        className="relative mt-2 rounded-[8px] bg-[#ffd9d6] px-1.5 py-0.5 shadow-[0_1px_6px_rgba(122,29,26,0.08)] text-[#7a1d1a]"
        animate={{ y: stage >= 1 ? -5 : 0, scale: stage >= 1 ? 0.985 : 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="flex items-center gap-1.5">
          <div className="flex size-3 shrink-0 items-center justify-center rounded-full bg-[#31465d] text-[7px] text-[#eaf1f8]">
            !
          </div>
          <div className="flex min-w-0 items-baseline gap-1.5">
            <span className="font-['OpenRunde-Semibold','Open_Runde',system-ui,sans-serif] text-[15px] font-semibold leading-5">
              Rate limit reached
            </span>
            <span className="truncate font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] text-[15px] leading-5 text-[#8f2e2a]">
              <span className="font-bold text-[#7a1d1a]">1h 30m</span> left
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="relative mt-2 flex justify-end"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: stage >= 1 ? 1 : 0, y: stage >= 1 ? -2 : 10 }}
        transition={{ duration: 0.38 }}
      >
        <div className="max-w-[78%] rounded-[18px] rounded-tr-md bg-[#31465d] px-3.5 py-2.5 font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] text-[13px] text-[#f4f8fb] shadow-[0_12px_30px_rgba(49,70,93,0.22)]">
          {typedPrompt}
          {!typingDone && (
            <motion.span
              className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 rounded-full bg-[#f4f8fb]"
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>

      <motion.div
        className="relative mt-2 rounded-[18px] bg-[#e8eef4] px-3.5 py-2 shadow-[0_1px_8px_rgba(49,70,93,0.06)]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: typingDone ? 1 : 0, y: typingDone ? 0 : 10 }}
        transition={{ duration: 0.2 }}
      >
        <div className="font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] text-[13px] font-semibold text-[#31465d]">
          ⏰ Waiting for 90min..
        </div>
      </motion.div>

      <motion.div
        className="relative mt-2 rounded-[18px] rounded-tl-md bg-white px-3.5 py-2 text-[#7a1d1a] shadow-sm"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: stage >= 3 ? 1 : 0, y: stage >= 3 ? 0 : 12 }}
        transition={{ duration: 0.45 }}
      >
        <div className="font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] text-[13px] leading-5">
          {typedResponse}
          {stage >= 3 && responseCount < fullResponse.length && (
            <motion.span
              className="ml-0.5 inline-block h-4 w-1 translate-y-0.5 rounded-full bg-[#31465d]"
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function BrowserPreview({
  slid,
  focused,
  fixing,
  fixDiff,
  reloading,
  reloadDone,
  config,
}: {
  slid: boolean;
  focused: boolean;
  fixing: boolean;
  fixDiff: boolean;
  reloading: boolean;
  reloadDone: boolean;
  config: AnimationConfig;
}) {
  return null;
}

function NetworkPanel({ fixed }: { fixed: boolean }) {
  return (
    <div className="[font-synthesis:none] flex flex-col bg-white antialiased">
      <div className="flex items-center justify-between relative pt-2.75 pr-3 pb-3.5 pl-3.75 h-10.75">
        <div className="left-4.75 top-3.75 w-52.75 h-7 rounded-lg absolute bg-white filter-[grayscale(100%)]" />
        <div className="flex left-0 top-0 items-center gap-1 relative p-0">
          <svg
            width="1em"
            height="1em"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: "0" }}
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M11.132 4.432C11.482 4.099 11.773 4 12 4C12.227 4 12.518 4.099 12.868 4.432C13.222 4.769 13.587 5.304 13.915 6.042C14.476 7.305 14.873 9.033 14.974 11H9.026C9.127 9.033 9.524 7.305 10.085 6.042C10.413 5.304 10.778 4.769 11.132 4.432ZM7.023 11C7.126 8.796 7.568 6.782 8.258 5.23C8.318 5.094 8.381 4.961 8.446 4.831C6.095 5.999 4.4 8.289 4.062 11H7.023ZM4.062 13H7.023C7.126 15.204 7.568 17.218 8.258 18.77C8.318 18.906 8.381 19.039 8.446 19.169C6.095 18.001 4.4 15.711 4.062 13ZM2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12ZM19.938 11C19.6 8.289 17.905 5.999 15.554 4.831C15.619 4.961 15.682 5.094 15.742 5.23C16.432 6.782 16.874 8.796 16.977 11H19.938ZM16.977 13H19.938C19.6 15.711 17.905 18.001 15.554 19.169C15.619 19.039 15.682 18.906 15.742 18.77C16.432 17.218 16.874 15.204 16.977 13ZM14.974 13C14.873 14.966 14.476 16.695 13.915 17.958C13.587 18.696 13.222 19.231 12.868 19.568C12.518 19.901 12.227 20 12 20C11.773 20 11.482 19.901 11.132 19.568C10.778 19.231 10.413 18.696 10.085 17.958C9.524 16.695 9.127 14.966 9.026 13H14.974Z"
              fill="#949494"
            />
          </svg>
          <div className="[letter-spacing:-0.125px] w-max text-[color(display-p3_0.332_0.332_0.332)] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium shrink-0 text-xs/4.5">
            Network
          </div>
        </div>
        <svg
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          viewBox="0 0 15.847 15.496"
          width="15.847"
          height="15.496"
          style={{
            left: "0px",
            top: "0px",
            width: "9px",
            height: "auto",
            position: "relative",
            flexShrink: "0",
          }}
        >
          <g>
            <path
              d="M0.253 15.243C0.594 15.575 1.161 15.575 1.493 15.243L7.743 8.993L13.993 15.243C14.325 15.575 14.901 15.585 15.233 15.243C15.565 14.901 15.565 14.345 15.233 14.012L8.983 7.753L15.233 1.503C15.565 1.171 15.575 0.604 15.233 0.272C14.891-0.07 14.325-0.07 13.993 0.272L7.743 6.522L1.493 0.272C1.161-0.07 0.585-0.079 0.253 0.272C-0.079 0.614-0.079 1.171 0.253 1.503L6.503 7.753L0.253 14.012C-0.079 14.345-0.089 14.911 0.253 15.243Z"
              fill="#939393D9"
            />
          </g>
        </svg>
      </div>
      <div className="flex flex-col relative pt-0.5 pr-2.25 pb-2.5 pl-3.75 gap-3.25 h-15.5">
        <div className="left-4.75 top-4 w-19.5 h-6.25 rounded-lg absolute bg-[#FBFBFB] filter-[grayscale(100%)]" />
        <motion.div
          className="left-0 top-4.5 w-68.5 h-4.5 absolute"
          style={{
            backgroundImage:
              "linear-gradient(in oklab 90deg, oklab(92.4% 0.044 0.024 / 0%) 2.47%, oklab(92.4% 0.044 0.024) 12.64%, oklab(92.4% 0.044 0.024 / 0%) 100%)",
          }}
          animate={{ opacity: fixed ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        />
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-1">
            <div className="rounded-full bg-[#E7E7E7] shrink-0 size-2" />
            <div className="w-15.25 h-2 rounded-full bg-[#E7E7E7] shrink-0" />
          </div>
          <div className="w-4 h-2 rounded-full bg-[#E7E7E7] shrink-0" />
        </div>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-1">
            <motion.div
              className="rounded-full shrink-0 size-2"
              animate={{ backgroundColor: fixed ? "#E7E7E7" : "#FF6C58" }}
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="w-27.5 h-2 rounded-full shrink-0"
              animate={{ backgroundColor: fixed ? "#E7E7E7" : "#FF9F8E" }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <motion.div
            className="w-7.25 h-2 rounded-full shrink-0"
            animate={{ backgroundColor: fixed ? "#E7E7E7" : "#FFB1A2" }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-1">
            <div className="rounded-full bg-[#F1F1F1] shrink-0 size-2" />
            <div className="w-7.75 h-2 rounded-full bg-[#F1F1F1] shrink-0" />
          </div>
          <div className="w-4 h-2 rounded-full bg-[#F1F1F1] shrink-0" />
        </div>
      </div>
    </div>
  );
}

function AnimatedCursor({
  visible,
  onBrowser,
  onTerminal,
  clicking,
  clickingTerminal,
  labelVisible,
  label,
  config,
}: {
  visible: boolean;
  onBrowser: boolean;
  onTerminal: boolean;
  clicking: boolean;
  clickingTerminal: boolean;
  labelVisible: boolean;
  label: CursorLabelState;
  config: AnimationConfig;
}) {
  const isAlert = label === "alert";
  return (
    <motion.div
      className="absolute z-30 pointer-events-none"
      style={{ transformOrigin: "top left" }}
      initial={{ x: 200, y: 115, opacity: 0, scale: 0 }}
      animate={
        visible && onTerminal
          ? { x: 210, y: 80, opacity: 1, scale: 1 }
          : visible && onBrowser
            ? { x: -60, y: 145, opacity: 1, scale: 1 }
            : visible
              ? { x: 200, y: 115, opacity: 1, scale: 1 }
              : { opacity: 0, scale: 0.8 }
      }
      transition={
        !visible
          ? { duration: 0.2, ease: "easeOut" }
          : { duration: config.cursorMoveDuration / 1000, ease: [0.22, 1, 0.36, 1] }
      }
    >
      <motion.svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "40px", height: "auto" }}
        animate={
          isAlert
            ? { scale: 1, x: [0, -3, 3, -2, 2, -1, 1, 0] }
            : { scale: clicking || clickingTerminal ? 0.85 : 1, x: 0 }
        }
        transition={
          isAlert
            ? {
                x: { duration: 0.4, ease: "easeOut" },
                scale: { duration: config.clickDuration / 1000, ease: "easeOut" },
              }
            : { duration: config.clickDuration / 1000, ease: "easeOut" }
        }
      >
        <g filter="url(#filter0_d_4_7)">
          <path
            d="M2.58591 2.58594C3.14041 2.03143 3.96783 1.85171 4.70212 2.12695L15.7021 6.25195C16.5219 6.55937 17.0468 7.36516 16.997 8.23926C16.9471 9.11309 16.3344 9.85306 15.4853 10.0654L11.1484 11.1484L10.0654 15.4854C9.85303 16.3345 9.11306 16.9471 8.23923 16.9971C7.36513 17.0469 6.55934 16.5219 6.25192 15.7021L2.12692 4.70215C1.85168 3.96786 2.0314 3.14045 2.58591 2.58594Z"
            fill="white"
            stroke="white"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </g>
        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.17558 3.53185C3.99199 3.463 3.7851 3.50782 3.64646 3.64646C3.50782 3.7851 3.463 3.99199 3.53185 4.17558L7.65685 15.1756C7.7337 15.3805 7.93492 15.5117 8.15345 15.4992C8.37197 15.4868 8.557 15.3336 8.61009 15.1213L9.91232 9.91232L15.1213 8.61009C15.3336 8.557 15.4868 8.37197 15.4992 8.15345C15.5117 7.93492 15.3805 7.7337 15.1756 7.65685L4.17558 3.53185Z"
          animate={{
            fill: label === "fixed" ? "#28A745" : isAlert ? "#F03E35" : "#0A0A0A",
            stroke: label === "fixed" ? "#28A745" : isAlert ? "#F03E35" : "#0A0A0A",
          }}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          transition={{ duration: config.colorTransitionDuration / 1000 }}
        />
        <defs>
          <filter
            id="filter0_d_4_7"
            x="-0.000274658"
            y="-0.000244141"
            width="19.0005"
            height="19.0006"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset />
            <feGaussianBlur stdDeviation="1" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0" />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_4_7" />
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_4_7" result="shape" />
          </filter>
          <linearGradient
            id="paint0_linear_4_7"
            x1="9.50001"
            y1="3.5"
            x2="9.50001"
            y2="15.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0172F4" />
            <stop offset="1" stopColor="#0168DF" />
          </linearGradient>
        </defs>
      </motion.svg>
      <motion.div
        className="absolute left-4 top-4 rounded-full px-2.5 py-1.5 font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[13px]/4.5 whitespace-nowrap bg-white [box-shadow:0_0_0_0.5px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.06)] flex items-center gap-1.5 origin-top-left"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: labelVisible ? 1 : 0, scale: labelVisible ? 1 : 0.5 }}
        transition={{ duration: config.labelDuration / 1000 }}
      >
        {label === "security" && <StarDots />}
        {isAlert && (
          <svg className="size-3.75" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 4L12 12M12 4L4 12"
              stroke="#F03E35"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        )}
        {label === "fixed" && (
          <svg className="size-3.75" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5L6.5 12L13 4"
              stroke="#28A745"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </motion.div>
    </motion.div>
  );
}

function TerminalIllustration() {
  const [cycle, setCycle] = useState(0);
  const nextCycle = () => setCycle((previous) => previous + 1);

  return (
    <TerminalAnimationView
      key={cycle}
      config={DEFAULT_CONFIG}
      cycle={cycle}
      onComplete={nextCycle}
    />
  );
}

  function TerminalAnimationView({
  config,
  cycle,
  onComplete,
}: {
  config: AnimationConfig;
  cycle: number;
  onComplete: () => void;
}) {
  const animState = useAnimationPhase(config, onComplete);
  const {
    phase,
    slid,
    focused,
    terminalFocused,
    fixing,
    fixDiff,
    reloading,
    reloadDone,
    looping,
  } = animState;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 text-xs/4 mt-4 sm:mt-5 p-2 pb-3 sm:pb-4">
      <div className="relative flex w-[min(44rem,calc(100vw-2rem))] min-h-[13rem] shrink-0 justify-center overflow-visible">
        <BrowserPreview
          slid={slid}
          focused={focused}
          fixing={fixing}
          fixDiff={fixDiff}
          reloading={reloading}
          reloadDone={reloadDone}
          config={config}
        />
        <motion.div
          className={`flex w-full max-w-[34rem] flex-col items-center relative z-10 rounded-[34px] overflow-visible bg-transparent ${terminalFocused ? "" : ""}`}
          style={{ x: 0 }}
          animate={{ scale: terminalFocused ? 1.04 : 1, zIndex: terminalFocused ? 20 : 10 }}
          transition={{
            type: "spring",
            stiffness: config.terminalSpringStiffness,
            damping: config.terminalSpringDamping,
            mass: config.terminalSpringMass / 1000,
          }}
        >
          <TerminalContent
            cycle={cycle}
            phase={phase}
            fixing={fixing}
            fixDiff={fixDiff}
            looping={looping}
            config={config}
          />
        </motion.div>
      </div>
    </div>
  );
}

const formatStarCount = (count: number) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(count);
};

function highlightSyntax(code: string, lang: "json" | "toml" | "sh") {
  if (lang === "sh") {
    return code.split(/(\s+)/).map((token, index) => {
      if (token.startsWith("--"))
        return (
          <span key={index} className="text-[#0033B3]">
            {token}
          </span>
        );
      if (token.startsWith("-"))
        return (
          <span key={index} className="text-[#0033B3]">
            {token}
          </span>
        );
      return (
        <span key={index} className="text-[#000000]">
          {token}
        </span>
      );
    });
  }
  if (lang === "toml") {
    return code.split("\n").map((line, lineIndex, lines) => {
      const highlighted = line.replace(
        /(\[[\w.]+\])|("[^"]*")|(\b\w+\b)(?=\s*=)/g,
        (match, section, str, key) => {
          if (section) return `\x01s${section}\x01`;
          if (str) return `\x01v${str}\x01`;
          if (key) return `\x01k${key}\x01`;
          return match;
        },
      );
      const parts = highlighted.split("\x01").map((part, partIndex) => {
        if (part.startsWith("s"))
          return (
            <span key={partIndex} className="text-[#871094]">
              {part.slice(1)}
            </span>
          );
        if (part.startsWith("v"))
          return (
            <span key={partIndex} className="text-[#067D17]">
              {part.slice(1)}
            </span>
          );
        if (part.startsWith("k"))
          return (
            <span key={partIndex} className="text-[#871094]">
              {part.slice(1)}
            </span>
          );
        return (
          <span key={partIndex} className="text-[#000000]">
            {part}
          </span>
        );
      });
      return (
        <span key={lineIndex}>
          {parts}
          {lineIndex < lines.length - 1 && "\n"}
        </span>
      );
    });
  }
  return code.split("\n").map((line, lineIndex, lines) => {
    const highlighted = line.replace(
      /("(?:[^"\\]|\\.)*")\s*(:)|("(?:[^"\\]|\\.)*")|(true|false|null|\b\d+\b)/g,
      (match, key, colon, str, literal) => {
        if (key) return `\x01k${key}\x01\x01p${colon}\x01`;
        if (str) return `\x01v${str}\x01`;
        if (literal) return `\x01l${literal}\x01`;
        return match;
      },
    );
    const parts = highlighted.split("\x01").map((part, partIndex) => {
      if (part.startsWith("k"))
        return (
          <span key={partIndex} className="text-[#871094]">
            {part.slice(1)}
          </span>
        );
      if (part.startsWith("p"))
        return (
          <span key={partIndex} className="text-[#000000]">
            {part.slice(1)}
          </span>
        );
      if (part.startsWith("v"))
        return (
          <span key={partIndex} className="text-[#067D17]">
            {part.slice(1)}
          </span>
        );
      if (part.startsWith("l"))
        return (
          <span key={partIndex} className="text-[#0033B3]">
            {part.slice(1)}
          </span>
        );
      return (
        <span key={partIndex} className="text-[#000000]">
          {part}
        </span>
      );
    });
    return (
      <span key={lineIndex}>
        {parts}
        {lineIndex < lines.length - 1 && "\n"}
      </span>
    );
  });
}

const MCP_CLIENTS = [
  {
    name: "Install",
    command: "npx prompt-later",
    lang: "sh",
  },
  {
    name: "Wait 10 seconds",
    command: "/wait 10s hello",
    lang: "sh",
  },
  {
    name: "Wait 1 minute",
    command: "/wait 1 minute summarize the latest changes",
    lang: "sh",
  },
  {
    name: "Wait 1h 30min",
    command: "/wait 1h 30min continue after my usage limit resets",
    lang: "sh",
  },
  {
    name: "Steer later",
    command: "/steer 30 seconds keep the final answer concise",
    lang: "sh",
  },
  {
    name: "Uninstall",
    command: "npx prompt-later uninstall",
    lang: "sh",
  },
] as const;

export default function HomePage() {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [starCount, setStarCount] = useState<string>("1");
  const [activeMcpClient, setActiveMcpClient] = useState(0);
  const [mcpCopied, setMcpCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  const waitRunCommandRef = useRef<HTMLDivElement>(null);
  const mcpPreRef = useRef<HTMLPreElement>(null);
  const [mcpScrollFade, setMcpScrollFade] = useState<"right" | "both" | "left" | "none">("right");

  useEffect(() => {
    fetch("https://api.github.com/repos/brahimhamichan/prompt-later")
      .then((response) => response.json())
      .then((data) => {
        if (data.stargazers_count) setStarCount(formatStarCount(data.stargazers_count));
      })
      .catch(() => {});
  }, []);

  const commandText = "npx prompt-later";

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (typeof window === "undefined" || !text) return false;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fallback below
    }

    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    const didCopy = document.execCommand("copy");
    document.body.removeChild(textArea);
    return didCopy;
  };

  const handleSelectCommand = () => {
    if (!commandRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(commandRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleCopyCommand = async () => {
    const didCopy = await copyToClipboard(commandText);
    if (didCopy) {
      setCommandCopied(true);
      setTimeout(() => setCommandCopied(false), 1500);
    }
  };

  const handleSelectWaitRunCommand = () => {
    if (!waitRunCommandRef.current) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(waitRunCommandRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const updateMcpScrollFade = () => {
    const el = mcpPreRef.current;
    if (!el) return;
    const atLeft = el.scrollLeft <= 1;
    const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    if (atLeft && atRight) setMcpScrollFade("none");
    else if (atLeft) setMcpScrollFade("right");
    else if (atRight) setMcpScrollFade("left");
    else setMcpScrollFade("both");
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMcpScrollFade("right");
    if (mcpPreRef.current) mcpPreRef.current.scrollLeft = 0;
    requestAnimationFrame(updateMcpScrollFade);
  }, [activeMcpClient]);

  return (
    <div className="[font-synthesis:none] overflow-x-clip antialiased min-h-screen bg-[color(display-p3_0.966_0.966_0.966)] flex flex-col items-center">
      <div className="w-full pt-3 sm:pt-6 pb-2 sm:pb-4 flex flex-col items-center relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.5) 15%, rgba(255,255,255,0.5) 85%, transparent 100%)",
          }}
        />
        <div className="w-full max-w-[760px] relative px-4 sm:px-0">
          <div className="flex justify-center sm:block">
            <div className="scale-[0.92] sm:scale-100 origin-top">
              <TerminalIllustration />
            </div>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-full max-w-[584px]"
          style={{
            background:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.06) 75%, transparent 100%)",
          }}
        />
      </div>
      <div className="home-page-below-hero w-full flex flex-col items-center">
        <div className="relative w-full max-w-112.75 min-w-0 px-4 sm:px-0">
          <div className="flex flex-col gap-[5px] mt-10">
            <div
              className="[white-space-collapse:preserve] font-['OpenRunde-Semibold','Open_Runde',system-ui,sans-serif] font-semibold text-[24px]/9.5 text-[#1a1a1a]"
              style={{ marginBottom: "-1px" }}
            >
              Prompt Later
            </div>
            <div className="[letter-spacing:0em] [white-space-collapse:preserve] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[17px]/[25px] text-[#707070]">
              A hook that waits before Codex ever sees your prompt.
            </div>
          </div>
          {/**
           * from Paper
           * https://app.paper.design/file/01KN3QGZ2REZDFZ3FZCNWXEANN?page=01KNK40PV23TWD3DPP1AV1WTS4&node=I51-0
           * on Apr 7, 2026
           */}
          <div className="flex flex-col gap-2.5" style={{ marginTop: "23px" }}>
            <div className="inline-flex items-center justify-between gap-2">
              <div className="font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] text-[13px] font-medium text-[#6a6a6a]">
                Install command
              </div>
              {commandCopied && (
                <div className="text-[12px] font-medium text-[#1d7f58]">Copied</div>
              )}
            </div>
            <div
              onClick={handleSelectCommand}
              role="textbox"
              aria-label="Installation command"
              className="[font-synthesis:none] flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border border-[#D8E0E7] bg-[#FFFFFF] px-3.5 py-2.5 transition-colors duration-150 hover:border-[#9db3c4] cursor-text"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0 text-[14px] font-medium text-[#69727a]">$</span>
                <div
                  ref={commandRef}
                  className="[white-space-collapse:preserve] min-w-0 text-[#222222] font-medium text-[16px]/6.25 truncate font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif]"
                >
                  {commandText}
                </div>
              </div>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void handleCopyCommand();
                }}
                className="ml-3 inline-flex h-8 w-8 flex-none cursor-pointer items-center justify-center rounded-lg border border-[#dde5ec] bg-[#F7FAFC] transition-all duration-150 hover:bg-[#edf3f7]"
                aria-label="Copy command"
              >
                {commandCopied ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ height: "16px", width: "16px", overflow: "clip", flexShrink: "0" }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.28 3.22a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06L4.75 7.69l4.47-4.47a.75.75 0 0 1 1.06 0Z"
                      fill="#059669"
                    />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    color="#0A0A0A"
                    style={{ height: "16px", width: "16px", overflow: "clip", flexShrink: "0" }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.25 2.25C3.25 1.698 3.698 1.25 4.25 1.25H9.25C10.079 1.25 10.75 1.922 10.75 2.75V7.75C10.75 8.302 10.302 8.75 9.75 8.75C9.474 8.75 9.25 8.526 9.25 8.25C9.25 7.974 9.474 7.75 9.75 7.75V2.75C9.75 2.474 9.526 2.25 9.25 2.25H4.25C4.25 2.526 4.026 2.75 3.75 2.75C3.474 2.75 3.25 2.526 3.25 2.25ZM1.25 4.75C1.25 3.922 1.922 3.25 2.75 3.25H7.25C8.078 3.25 8.75 3.922 8.75 4.75V9.25C8.75 10.079 8.078 10.75 7.25 10.75H2.75C1.922 10.75 1.25 10.079 1.25 9.25V4.75ZM2.75 4.25C2.474 4.25 2.25 4.474 2.25 4.75V9.25C2.25 9.526 2.474 9.75 2.75 9.75H7.25C7.526 9.75 7.75 9.526 7.75 9.25V4.75C7.75 4.474 7.526 4.25 7.25 4.25H2.75Z"
                      fill="#696969"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="relative w-full max-w-112.75 min-w-0 px-4 sm:px-0">
          <div className="[font-synthesis:none] flex w-full min-w-0 h-fit flex-col gap-4.25 antialiased mt-14">
            <div className="mb-0 left-0 top-0 w-full min-w-0 [white-space-collapse:preserve] relative text-[#3F3F3F] font-['OpenRunde-Semibold','Open_Runde',system-ui,sans-serif] font-semibold text-[18px]/5.75">
              Getting started
            </div>
            {/**
             * from Paper
             * https://app.paper.design/file/01KN3QGZ2REZDFZ3FZCNWXEANN?page=01KNK40PV23TWD3DPP1AV1WTS4&node=I2N-0
             * on Apr 7, 2026
             */}
            <div className="[font-synthesis:none] flex w-full min-w-0 flex-col items-stretch gap-2.5 antialiased p-0">
              <div className="flex w-full min-w-0 items-start gap-1.5">
                <div className="h-6.75 text-[color(display-p3_0.722_0.722_0.722)] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium shrink-0 text-[16px]/6.75">
                  •
                </div>
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1.5">
                  <div className="text-[#5a5a5a] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[16px]/6.75">
                    Run
                  </div>
                  <div
                    className="inline-flex items-center rounded-[9px] bg-[#d6ede4] px-2.25 py-0"
                    onClick={handleSelectWaitRunCommand}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      handleSelectWaitRunCommand();
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Select /wait command text"
                  >
                    <div
                      ref={waitRunCommandRef}
                      className="text-[#173b33] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[16px]/6.75"
                    >
                      /wait
                    </div>
                  </div>
                  <div className="text-[#5a5a5a] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[16px]/6.75">
                    inside Codex after install,
                  </div>
                  <a
                    href="https://github.com/brahimhamichan/prompt-later"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer text-[#0f766e] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium underline decoration-[#9ccfbf] decoration-2 underline-offset-[5px] text-[16px]/6.75 transition-[text-decoration-color] duration-200 ease-out hover:decoration-[#173b33]"
                  >
                    with examples
                  </a>
                </div>
              </div>
              <div className="flex w-full min-w-0 items-start gap-1.5">
                <div className="h-6.75 text-[color(display-p3_0.722_0.722_0.722)] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium shrink-0 text-[16px]/6.75">
                  •
                </div>
                <div className="min-w-0 flex-1 text-[#5a5a5a] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[16px]/6.75">
                  Prompt Later runs a terminal sleep before the model request is sent, then
                  releases only your final prompt.
                </div>
              </div>
              <div className="flex w-full min-w-0 items-start gap-1.5">
                <div className="h-6.75 text-[color(display-p3_0.722_0.722_0.722)] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium shrink-0 text-[16px]/6.75">
                  •
                </div>
                <div className="min-w-0 flex-1 text-[#5a5a5a] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[16px]/6.75">
                  The tiny skill files are only autocomplete markers; the hook owns the actual
                  waiting behavior.
                </div>
              </div>
            </div>
          </div>
        </div>
          <div className="relative w-full max-w-112.75 min-w-0 px-4 sm:px-0">
          <a
            href="https://github.com/brahimhamichan/prompt-later"
            target="_blank"
            rel="noopener noreferrer"
            className="group [font-synthesis:none] items-center flex justify-between mt-[20px] w-fit rounded-full overflow-clip gap-0.5 pl-[14px] pr-1.75 py-2 bg-white [box-shadow:#0000000F_0px_0px_0px_1px,#0000000F_0px_1px_2px_-1px,#0000000A_0px_2px_4px] antialiased transition-shadow hover:[box-shadow:#00000014_0px_0px_0px_1px,#00000014_0px_1px_2px_-1px,#0000000F_0px_2px_4px]"
          >
            <div className="items-center flex gap-1.25">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  flexShrink: "0",
                  verticalAlign: "middle",
                  width: "15px",
                  height: "15px",
                  overflow: "clip",
                }}
              >
                <defs>
                  <clipPath id="_starclip">
                    <rect width="12" height="12" fill="#fff" />
                  </clipPath>
                </defs>
                <g clipPath="url(#_starclip)">
                  <path
                    className="fill-[#C0C0C0] transition-colors group-hover:fill-[#f0bd69]"
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.884 1.195C6.513 0.468 5.474 0.468 5.103 1.195L3.94 3.474L1.414 3.875C0.608 4.004 0.287 4.992 0.864 5.57L2.671 7.38L2.273 9.906C2.145 10.713 2.986 11.323 3.714 10.953L5.994 9.793L8.273 10.953C9.001 11.323 9.842 10.713 9.715 9.906L9.316 7.38L11.124 5.57C11.701 4.992 11.379 4.004 10.573 3.875L8.047 3.474L6.884 1.195Z"
                  />
                </g>
              </svg>
              <div className="shrink-0 [letter-spacing:-0.14px] w-max text-[#323232] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15px]/4.5">
                GitHub
              </div>
            </div>
            <div className="flex flex-col items-start gap-0 px-2 py-0.75 rounded-full">
              <div className="items-center flex gap-1.25">
                <div className="shrink-0 [letter-spacing:-0.14px] w-max text-[#323232] font-medium text-sm/4.5 font-mono-override">
                  {starCount}
                </div>
              </div>
            </div>
          </a>
          <div
            className="left-0 top-0 w-full min-w-0 [white-space-collapse:preserve] relative text-[#3F3F3F] font-['OpenRunde-Semibold','Open_Runde',system-ui,sans-serif] font-semibold text-[18px]/5.75 mt-14"
            style={{ marginBottom: "10px" }}
          >
            Examples
          </div>
          <div className="[letter-spacing:0em] max-w-102 [white-space-collapse:preserve] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[16px]/6.75 text-[#707070] mt-1.5">
            Prompt Later supports human-friendly durations, including seconds, minutes,
            hours, and decimals.
          </div>
          <div
            className="[font-synthesis:none] flex w-full flex-col rounded-[14px] [box-shadow:#0000000F_0px_0px_0px_1px,#0000000F_0px_1px_2px_-1px,#0000000A_0px_2px_4px] antialiased cursor-text"
            style={{ marginTop: "23px" }}
          >
            <div className="flex items-center justify-between bg-white rounded-t-[14px] pt-2.5 pr-3.5 pb-2.5 pl-3.75">
              <div className="flex items-center gap-1.5">
                <div className="font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15.5px]/5.75 text-[#6e6e6e]">
                  Example:
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="cursor-pointer flex items-center gap-1.5 outline-none">
                    <div className="font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15.5px]/5.75 text-[#414141]">
                      {MCP_CLIENTS[activeMcpClient].name}
                    </div>
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M2.5 4L5 6.5L7.5 4"
                        stroke="#696969"
                        strokeWidth="1.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-64 w-56 scrollbar-visible font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif]">
                    {MCP_CLIENTS.map((client, index) => (
                      <DropdownMenuItem
                        key={client.name}
                        className={`cursor-pointer font-medium text-[15px]/5.75 ${activeMcpClient === index ? "text-[#1a1a1a] bg-accent" : "text-[#696969]"}`}
                        onClick={() => setActiveMcpClient(index)}
                      >
                        {client.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const text = MCP_CLIENTS[activeMcpClient].command;
                  const didCopy = await copyToClipboard(text);
                  if (didCopy) {
                    setMcpCopied(true);
                    setTimeout(() => setMcpCopied(false), 1500);
                  }
                }}
                className="cursor-pointer shrink-0 content-center group"
                aria-label="Copy configuration"
              >
                {mcpCopied && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      height: "20px",
                      verticalAlign: "middle",
                      width: "20px",
                      overflow: "clip",
                    }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10.28 3.22a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06 0l-2.5-2.5a.75.75 0 1 1 1.06-1.06L4.75 7.69l4.47-4.47a.75.75 0 0 1 1.06 0Z"
                      fill="#059669"
                    />
                  </svg>
                )}
                {!mcpCopied && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    color="#0A0A0A"
                    style={{
                      height: "20px",
                      verticalAlign: "middle",
                      width: "20px",
                      overflow: "clip",
                      flexShrink: "0",
                    }}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.25 2.25C3.25 1.698 3.698 1.25 4.25 1.25H9.25C10.079 1.25 10.75 1.922 10.75 2.75V7.75C10.75 8.302 10.302 8.75 9.75 8.75C9.474 8.75 9.25 8.526 9.25 8.25C9.25 7.974 9.474 7.75 9.75 7.75V2.75C9.75 2.474 9.526 2.25 9.25 2.25H4.25C4.25 2.526 4.026 2.75 3.75 2.75C3.474 2.75 3.25 2.526 3.25 2.25ZM1.25 4.75C1.25 3.922 1.922 3.25 2.75 3.25H7.25C8.078 3.25 8.75 3.922 8.75 4.75V9.25C8.75 10.079 8.078 10.75 7.25 10.75H2.75C1.922 10.75 1.25 10.079 1.25 9.25V4.75ZM2.75 4.25C2.474 4.25 2.25 4.474 2.25 4.75V9.25C2.25 9.526 2.474 9.75 2.75 9.75H7.25C7.526 9.75 7.75 9.526 7.75 9.25V4.75C7.75 4.474 7.526 4.25 7.25 4.25H2.75Z"
                      fill="#696969"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-start gap-2.75 min-w-0 pr-3.5 pb-3 pl-3.75 pt-0 rounded-b-[14px] bg-white">
              {MCP_CLIENTS[activeMcpClient].lang === "sh" && (
                <div className="[white-space-collapse:preserve] w-max text-[#696969] font-mono-override font-medium shrink-0 text-[15.5px]/5.75">
                  $
                </div>
              )}
              <pre
                ref={mcpPreRef}
                onScroll={updateMcpScrollFade}
                className="min-w-0 font-mono-override font-medium text-[15.5px]/5.75 whitespace-pre overflow-x-auto scrollbar-none"
                style={{
                  maskImage:
                    mcpScrollFade === "none"
                      ? "none"
                      : `linear-gradient(to right, ${mcpScrollFade === "left" || mcpScrollFade === "both" ? "transparent, black 32px" : "black 0%"}, ${mcpScrollFade === "right" || mcpScrollFade === "both" ? "black calc(100% - 32px), transparent" : "black 100%"})`,
                  WebkitMaskImage:
                    mcpScrollFade === "none"
                      ? "none"
                      : `linear-gradient(to right, ${mcpScrollFade === "left" || mcpScrollFade === "both" ? "transparent, black 32px" : "black 0%"}, ${mcpScrollFade === "right" || mcpScrollFade === "both" ? "black calc(100% - 32px), transparent" : "black 100%"})`,
                }}
              >
                {highlightSyntax(
                  MCP_CLIENTS[activeMcpClient].command,
                  MCP_CLIENTS[activeMcpClient].lang,
                )}
              </pre>
            </div>
          </div>
          <div className="flex flex-col w-full max-w-107.25 mt-14">
            <div className="[letter-spacing:0em] font-['OpenRunde-Semibold','Open_Runde',system-ui,sans-serif] font-semibold text-[18px]/5.75 text-[color(display-p3_0.248_0.248_0.248)] mb-2.75">
              FAQ
            </div>
            <div className="h-[0.5px] self-stretch shrink-0 bg-[#c7d5e3] mb-3.5" />
            {[
              {
                question: "What is Prompt Later?",
                answer: (
                  <div className="flex flex-col gap-2 mt-1.5">
                    <div className="[letter-spacing:0em] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15px]/5.5 text-[#858585] mb-2.5">
                      A Codex hook that intercepts /wait and /steer before the model sees them, sleeps in the terminal, then sends the queued prompt.
                    </div>
                    <div className="[letter-spacing:0em] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15px]/5.5 text-[#858585] mb-2.5">
                      It installs globally with npm and wires Codex hook plus lightweight
                      slash-command marker skills.
                    </div>
                  </div>
                ),
              },
              {
                question: "Why not just ask the agent to sleep?",
                answer:
                  "If the agent receives the prompt first, usage limits and model context can still apply. Prompt Later sleeps before the request reaches the model.",
              },
              {
                question: "Does it send the skill file to the model?",
                answer:
                  "The slash-command files are intentionally tiny markers. The hook strips the command, waits locally, and injects the final prompt after the delay.",
              },
              {
                question: "Does it support seconds, minutes, and hours?",
                answer:
                  "Yes. Use 1s, 10 seconds, 1min, 1 minute, 1.5h, 1h 30min, 1 h 30 min, 2 hours, and similar natural variants.",
              },
              { question: "Can I queue or steer?", answer: "Yes. /wait queues a prompt for later, and /steer lets you add delayed steering instructions." },
              {
                question: "Where is the source?",
                answer: "The package and source are public at github.com/brahimhamichan/prompt-later.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="group/faq mb-2.5 last:mb-0 rounded-2xl border border-[#b8c7d8] bg-[#eef5fb]/85 px-4 pb-3 shadow-[0_8px_30px_rgba(28,55,82,0.06)] transition-colors hover:bg-[#f7fbff]"
              >
                <div
                  className="flex justify-between items-start transition-colors group-hover/faq:text-[#1E1E1E] pt-2.75 cursor-pointer"
                  onClick={() =>
                    setOpenFaqs((previous) => {
                      const next = new Set(previous);
                      if (next.has(index)) {
                        next.delete(index);
                      } else {
                        next.add(index);
                      }
                      return next;
                    })
                  }
                >
                  <div
                    className={`[letter-spacing:0em] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15px]/5.75 transition-colors group-hover/faq:text-[#1E1E1E] ${openFaqs.has(index) ? "text-[#1E1E1E]" : "text-[#5A5A5A]"}`}
                  >
                    {faq.question}
                  </div>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ width: "20px", height: "auto", flexShrink: "0" }}
                    className={`group-hover/faq:text-[#1E1E1E] transition-all duration-200 ${openFaqs.has(index) ? "text-[#1E1E1E] rotate-45" : "text-[#5A5A5A]"}`}
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6.5 3C6.5 2.724 6.276 2.5 6 2.5C5.724 2.5 5.5 2.724 5.5 3V5.5H3C2.724 5.5 2.5 5.724 2.5 6C2.5 6.276 2.724 6.5 3 6.5H5.5V9C5.5 9.276 5.724 9.5 6 9.5C6.276 9.5 6.5 9.276 6.5 9V6.5H9C9.276 6.5 9.5 6.276 9.5 6C9.5 5.724 9.276 5.5 9 5.5H6.5V3Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div
                  className={`grid transition-[grid-template-rows,opacity] duration-200 ${openFaqs.has(index) ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    {typeof faq.answer === "string" && (
                      <div className="[letter-spacing:0em] font-['OpenRunde-Medium','Open_Runde',system-ui,sans-serif] font-medium text-[15px]/5.5 text-[#858585] whitespace-pre-line mt-1.5">
                        {faq.answer}
                      </div>
                    )}
                    {typeof faq.answer !== "string" && faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
