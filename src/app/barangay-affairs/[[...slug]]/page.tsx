"use client";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import {
  AlertTriangle,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Megaphone,
  Users,
} from "lucide-react";

import s from "./home.module.css";

const slides = [
  {
    image: "/images/f1.jpeg",
    title: "Barangay Affairs Management System",
    subtitle: "Empowering local governance through streamlined digital services for the municipality of Matnog.",
  },
  {
    image: "/images/f2.jpeg",
    title: "Community-Centered Governance",
    subtitle: "Connecting barangays with efficient tools for resident registration, document processing, and more.",
  },
  {
    image: "/images/f3.jpg",
    title: "Serving the People of Matnog",
    subtitle: "Transparent, accessible, and reliable barangay services at the heart of every community.",
  },
];

const announcements = [
  {
    id: 1,
    icon: <Megaphone size={18} />,
    category: "Announcement",
    date: "September 20, 2026",
    title: "Barangay General Assembly Scheduled for October 5",
    body: "All registered residents are invited to attend the quarterly general assembly at their respective barangay halls. Attendance is encouraged for updates on community projects.",
  },
  {
    id: 2,
    icon: <AlertTriangle size={18} />,
    category: "Advisory",
    date: "September 18, 2026",
    title: "Typhoon Preparedness Advisory — Signal No. 1",
    body: "Residents in coastal barangays are advised to secure belongings and prepare emergency kits. Evacuation centers are on standby. Monitor official channels for updates.",
  },
  {
    id: 3,
    icon: <Calendar size={18} />,
    category: "Event",
    date: "September 15, 2026",
    title: "Free Medical & Dental Mission — Brgy. Bolo",
    body: "The municipal health office, in coordination with Brgy. Bolo officials, will conduct a free medical and dental mission on September 28, 2026. Bring your Barangay ID.",
  },
  {
    id: 4,
    icon: <FileText size={18} />,
    category: "Notice",
    date: "September 12, 2026",
    title: "Resident ID Renewal Period Extended to November 30",
    body: "The deadline for resident ID renewal has been extended. Visit your barangay hall with a valid government-issued ID and 1x1 photo to process your renewal.",
  },
  {
    id: 5,
    icon: <Users size={18} />,
    category: "Notice",
    date: "September 10, 2026",
    title: "Community Census Data Collection Underway",
    body: "Field enumerators will visit households across all barangays for the annual community census. Please cooperate and provide accurate household information.",
  },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5000);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const go = (index: number) => {
    setCurrent(index);
    resetTimer();
  };
  const prev = () => go((current - 1 + slides.length) % slides.length);
  const next = () => go((current + 1) % slides.length);

  return (
    <div className={s.page}>
      {/* Carousel */}
      <section className={s.carousel}>
        {slides.map((slide, i) => (
          <div
            key={slide.image}
            className={`${s.slide} ${i === current ? s.slideActive : ""}`}
            style={{ backgroundImage: `linear-gradient(rgba(7,50,40,0.65), rgba(7,50,40,0.7)), url(${slide.image})` }}
          >
            <div className={s.slideContent}>
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
            </div>
          </div>
        ))}
        <button type="button" className={`${s.carouselBtn} ${s.carouselPrev}`} onClick={prev} aria-label="Previous slide">
          <ChevronLeft size={22} />
        </button>
        <button type="button" className={`${s.carouselBtn} ${s.carouselNext}`} onClick={next} aria-label="Next slide">
          <ChevronRight size={22} />
        </button>
        <div className={s.dots}>
          {slides.map((_, i) => (
            <button
              type="button"
              key={i}
              className={`${s.dot} ${i === current ? s.dotActive : ""}`}
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Announcements & Notices */}
      <section className={s.content}>
        <div className={s.sectionHeader}>
          <Bell size={20} />
          <div>
            <h2>Announcements &amp; Notices</h2>
            <p>Stay updated with the latest from the municipality and your barangay.</p>
          </div>
        </div>
        <div className={s.announcementList}>
          {announcements.map((item) => (
            <article key={item.id} className={s.announcementCard}>
              <span className={s.announcementIcon}>{item.icon}</span>
              <div className={s.announcementBody}>
                <div className={s.announcementMeta}>
                  <span className={s.announcementCategory}>{item.category}</span>
                  <span className={s.announcementDate}>{item.date}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
