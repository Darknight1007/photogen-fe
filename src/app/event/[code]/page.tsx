"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { eventsApi, imagesApi } from "@/lib/api";

export default function PublicEventPage() {
    const params = useParams();
    const code = params.code as string;

    const [event, setEvent] = useState<any>(null);
    const [images, setImages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);


    useEffect(() => {
        const loadEvent = async () => {
            const { data } = await eventsApi.getByCode(code);

            if (!data) return;

            setEvent(data.event);

            const { data: imgData } = await imagesApi.getEventImages(data.event.id, {
                limit: 100,
            });

            if (imgData) setImages(imgData.images);

            setLoading(false);
        };

        loadEvent();
    }, [code]);

    if (loading) {
        return (
            <div className="min-h-screen bg-pattern flex items-center justify-center">
                Loading event...
            </div>
        );
    }

    const handleCopyCode = () => {
        if (event) {
            navigator.clipboard.writeText(event.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyLink = () => {
    if (event) {
      const link = `${window.location.origin}/join/${event.code}`;
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

    if (!event) return null;

    return (
        <main className="min-h-screen bg-pattern">
            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Event Header */}
                <div className="mb-8">

                    <h1 className="text-3xl font-bold mb-2">{event.name}</h1>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted">

                        {event.location && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>

                                {event.location}
                            </div>
                        )}

                        {event.eventDate && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>

                                {new Date(event.eventDate).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </div>
                        )}

                    </div>

                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                    <div className="card !p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>

                            <div>
                                <div className="text-muted text-sm">Photos</div>
                                <div className="text-2xl font-bold">{event.imageCount}</div>
                            </div>
                        </div>
                    </div>


                    <div className="card !p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>

                            <div>
                                <div className="text-muted text-sm">Participants</div>
                                <div className="text-2xl font-bold">{event.participantCount}</div>
                            </div>
                        </div>
                    </div>


                    <div className="card !p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>

                            <div>
                                <div className="text-muted text-sm">Status</div>
                                <div className="text-2xl font-bold">
                                    {event.isActive ? "Active" : "Inactive"}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>


                {/* Share Event */}
                <div className="card mb-8">
                    <h3 className="text-lg font-semibold mb-4">Share Event</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="bg-secondary/50 rounded-xl p-6 text-center">
                            <div className="text-m text-muted mt-4 mb-6">Event Code</div>
                            <code className="text-5xl font-mono font-bold tracking-wider text-primary">
                                {event.code}
                            </code>
                            <button
                                onClick={handleCopyCode}
                                className="mt-4 btn btn-secondary !py-2 !text-sm"
                            >
                                {copied ? "Copied!" : "Copy Code"}
                            </button>
                        </div>


                        {/* QR Code Placeholder */}
                        <div className="bg-secondary/50 rounded-xl p-6 text-center">
                            <div className="text-sm text-muted mb-2">Share Link</div>
                            <div className="w-32 h-32 mx-auto bg-white rounded-lg flex items-center justify-center mb-4">
                                <div className="text-muted text-xs">QR Code</div>
                            </div>
                            <button
                                onClick={handleCopyLink}
                                className="btn btn-secondary !py-2 !text-sm"
                            >
                                {copied ? "Copied!" : "Copy Link"}
                            </button>
                        </div>
                    </div>
                </div>

            </div>




            {/* Photos Section */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-6">Photos</h3>

                {images.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
                        <div className="text-muted">No photos uploaded yet</div>
                    </div>
                ) : (

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">

                        {images.map((image) => (
                            <div
                                key={image.id}
                                className="relative aspect-square rounded-lg overflow-hidden"
                            >
                                <img
                                    src={image.url}
                                    className="w-full h-full object-cover" />
                                {image.faceCount > 0 && (
                                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs text-white">
                                        {image.faceCount}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main >
    );
}