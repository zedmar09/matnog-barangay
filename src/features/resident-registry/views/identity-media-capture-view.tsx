"use client";

import { type FormEvent, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Camera, CheckCircle2, Crop, PenLine, RotateCcw, Search, Trash2, Upload, Video } from "lucide-react";

import { MATNOG_BARANGAYS } from "@/data/barangays";
import { useBarangayScope } from "@/shared/providers/barangay-scope-provider";

import styles from "../components/resident-registry.module.css";
import { useResidentRegistryStore } from "../stores/resident-registry-store";
import { formatResidentName } from "../utils/resident-utils";

function readImage(file: File, onReady: (value: string) => void, onError: (value: string) => void) {
  if (!file.type.startsWith("image/")) {
    onError("Choose a valid image file.");
    return;
  }
  if (file.size > 2_000_000) {
    onError("Choose an image smaller than 2 MB for this session demo.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => onReady(String(reader.result));
  reader.readAsDataURL(file);
}

export function IdentityMediaCaptureView() {
  const residents = useResidentRegistryStore((s) => s.residents);
  const submit = useResidentRegistryStore((s) => s.submitIdentityMedia);
  const { selectedBarangay } = useBarangayScope();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [residentId, setResidentId] = useState("");
  const [photo, setPhoto] = useState("");
  const [signature, setSignature] = useState("");
  const [reason, setReason] = useState("Initial identity media capture");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const selected = residents.find((r) => r.id === residentId);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return residents
      .filter(
        (r) =>
          (selectedBarangay === "all" || r.address.barangayId === selectedBarangay) &&
          r.residentStatus === "Active" &&
          `${r.lrn} ${formatResidentName(r)} ${r.contact.primaryMobile}`.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [query, residents, selectedBarangay]);
  useEffect(
    () => () =>
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      }),
    [],
  );
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError("");
    } catch {
      setError("Camera access is unavailable. Upload a photo instead.");
    }
  };
  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
    setCameraOn(false);
  };
  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    setPhoto(canvas.toDataURL("image/jpeg", 0.88));
    stopCamera();
  };
  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  };
  const begin = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const p = point(event);
    if (!canvas || !p) return;
    drawing.current = true;
    canvas.setPointerCapture(event.pointerId);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.strokeStyle = "#243c3a";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
    }
  };
  const draw = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(event);
    if (ctx && p) {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  };
  const end = () => {
    drawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) setSignature(canvas.toDataURL("image/png"));
  };
  const clearSignature = () => {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setSignature("");
  };
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!selected || (!photo && !signature) || !reason.trim()) {
      setError("Select a resident, capture a photo or signature, and enter a capture reason.");
      return;
    }
    const review = submit({
      residentId: selected.id,
      proposedPhotoUrl: photo,
      proposedSignatureUrl: signature,
      replacementReason: reason,
      qualityNotes: [
        ...(photo ? ["Face centered", "Lighting reviewed"] : []),
        ...(signature ? ["Signature legible"] : []),
      ],
    });
    if (review) router.push(`/barangay-affairs/residents/media/${review.id}?created=1`);
  };
  return (
    <div className={`${styles.page} ${styles.formShell}`}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>A1 Identity Media</p>
          <h1>Capture photo and signature</h1>
          <p>Prepare resident identity media for reviewer approval.</p>
        </div>
        <Link className={styles.secondaryButton} href="/barangay-affairs/residents/media">
          <ArrowLeft size={15} /> Media queue
        </Link>
      </header>
      {error && <div className={`${styles.toast} ${styles.error}`}>{error}</div>}
      <form className={styles.card} onSubmit={save}>
        <div className={styles.formBody}>
          <h2 className={styles.sectionTitle}>Resident</h2>
          <label className={styles.searchBox}>
            <Search size={15} />
            <input
              aria-label="Find resident"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search resident by name, LRN, or mobile"
            />
          </label>
          {query && !selected && (
            <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
              {results.map((r) => (
                <button
                  type="button"
                  className={styles.decisionOption}
                  key={r.id}
                  onClick={() => {
                    setResidentId(r.id);
                    setQuery(formatResidentName(r));
                  }}
                >
                  <span className={styles.avatarSm}>
                    {r.photoUrl ? (
                      <Image src={r.photoUrl} alt="" width={30} height={30} unoptimized />
                    ) : (
                      `${r.firstName[0]}${r.lastName[0]}`
                    )}
                  </span>
                  <span>
                    <strong>{formatResidentName(r)}</strong>
                    <small>
                      {r.lrn} · {MATNOG_BARANGAYS.find((b) => b.code === r.address.barangayId)?.name}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          )}
          <div className={styles.mediaGrid}>
            <section className={styles.captureCard}>
              <h3>
                <Camera size={16} /> Resident photo
              </h3>
              <p>Use a clear, front-facing image with even lighting.</p>
              <div className={styles.photoStage}>
                {cameraOn ? (
                  <video ref={videoRef} autoPlay muted playsInline />
                ) : photo ? (
                  <Image
                    src={photo}
                    alt="Photo preview"
                    width={220}
                    height={268}
                    unoptimized
                    style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
                  />
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <Camera size={28} />
                    <br />
                    <small>No photo captured</small>
                  </div>
                )}
              </div>
              <div className={styles.captureControls}>
                {cameraOn ? (
                  <>
                    <button type="button" className={styles.primaryButton} onClick={capture}>
                      <Camera size={14} /> Capture
                    </button>
                    <button type="button" className={styles.secondaryButton} onClick={stopCamera}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" className={styles.secondaryButton} onClick={startCamera}>
                      <Video size={14} /> Use camera
                    </button>
                    <label className={styles.secondaryButton}>
                      <Upload size={14} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) readImage(file, setPhoto, setError);
                        }}
                      />
                    </label>
                  </>
                )}
              </div>
              {photo && (
                <>
                  <label className={styles.rangeRow}>
                    <span>
                      <Crop size={12} /> Zoom
                    </span>
                    <input
                      aria-label="Photo zoom"
                      type="range"
                      min="100"
                      max="160"
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                    <b>{zoom}%</b>
                  </label>
                  <div className={styles.captureControls}>
                    <button
                      type="button"
                      className={styles.secondaryButton}
                      onClick={() => setRotation((v) => (v + 90) % 360)}
                    >
                      <RotateCcw size={13} /> Rotate
                    </button>
                    <button type="button" className={styles.dangerButton} onClick={() => setPhoto("")}>
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </>
              )}
            </section>
            <section className={styles.captureCard}>
              <h3>
                <PenLine size={16} /> Resident signature
              </h3>
              <p>Draw with a mouse, touchscreen, or stylus, or upload a signature image.</p>
              <canvas
                ref={canvasRef}
                className={styles.signatureCanvas}
                width={700}
                height={250}
                onPointerDown={begin}
                onPointerMove={draw}
                onPointerUp={end}
                onPointerCancel={end}
              />
              <div className={styles.captureControls}>
                <button type="button" className={styles.secondaryButton} onClick={clearSignature}>
                  <Trash2 size={13} /> Clear
                </button>
                <label className={styles.secondaryButton}>
                  <Upload size={14} /> Upload signature
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) readImage(file, setSignature, setError);
                    }}
                  />
                </label>
              </div>
              {signature && (
                <ul className={styles.qualityList}>
                  <li>
                    <CheckCircle2 size={13} /> Signature captured and ready for review
                  </li>
                </ul>
              )}
            </section>
          </div>
          <label className={styles.field} style={{ marginTop: 16 }}>
            <span>Capture or replacement reason *</span>
            <textarea aria-label="Capture reason" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
        </div>
        <footer className={styles.formFooter}>
          <span className={styles.sectionHelp}>Media remains pending until reviewer approval.</span>
          <button type="submit" className={styles.primaryButton}>
            <CheckCircle2 size={14} /> Submit for review
          </button>
        </footer>
      </form>
    </div>
  );
}
