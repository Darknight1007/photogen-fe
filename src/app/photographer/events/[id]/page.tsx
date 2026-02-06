"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { eventsApi, imagesApi, Event, Image } from "@/lib/api";
import BulkUploader from "@/components/BulkUploader";

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchEvent = useCallback(async () => {
    const { data } = await eventsApi.getById(eventId);
    if (data) {
      setEvent(data.event);
    } else {
      router.push("/photographer/dashboard");
    }
    setLoading(false);
  }, [eventId, router]);

  const fetchImages = useCallback(async () => {
    const { data } = await imagesApi.getEventImages(eventId, { limit: 100 });
    if (data) {
      setImages(data.images);
    }
  }, [eventId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/photographer/login");
      return;
    }
    fetchEvent();
    fetchImages();
  }, [router, fetchEvent, fetchImages]);

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

  const handleToggleActive = async () => {
    if (!event) return;
    await eventsApi.update(event.id, { isActive: !event.isActive });
    fetchEvent();
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }
    await eventsApi.delete(event.id);
    router.push("/photographer/dashboard");
  };

  const handleUploadComplete = () => {
    fetchEvent();
    fetchImages();
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const selectAllImages = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map((img) => img.id)));
    }
  };

  const deleteSelectedImages = async () => {
    if (selectedImages.size === 0) return;
    if (!confirm(`Delete ${selectedImages.size} selected photos?`)) return;

    setDeleting(true);
    await imagesApi.bulkDelete(Array.from(selectedImages));
    setSelectedImages(new Set());
    fetchEvent();
    fetchImages();
    setDeleting(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-pattern flex items-center justify-center">
        <div className="animate-pulse text-muted">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <main className="min-h-screen bg-pattern">
      {/* Header */}
      <header className="border-b border-border bg-secondary/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/photographer/dashboard"
              className="text-muted hover:text-foreground transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold">
              Photo<span className="gradient-text">Gen</span>
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Event Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold">{event.name}</h2>
              {!event.isActive && (
                <span className="px-2 py-1 bg-muted/20 text-muted text-sm rounded-md">
                  Inactive
                </span>
              )}
            </div>
            {event.description && (
              <p className="text-muted mb-4">{event.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              {event.location && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              )}
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(event.eventDate)}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="btn btn-secondary !w-auto !px-5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
            <button
              onClick={handleToggleActive}
              className="btn btn-secondary !w-auto !px-5"
            >
              {event.isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card !p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="text-muted text-sm">Status</div>
                <div className="text-2xl font-bold">{event.isActive ? "Active" : "Inactive"}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Section */}
        <div className="card mb-8">
          <h3 className="text-lg font-semibold mb-4">Share Event</h3>
          <p className="text-muted text-sm mb-6">
            Share this code or link with event attendees so they can find their photos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Code */}
            <div className="bg-secondary/50 rounded-xl p-6 text-center">
              <div className="text-sm text-muted mb-2">Event Code</div>
              <code className="text-3xl font-mono font-bold tracking-wider text-primary">
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

        {/* Photos Section */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">Photos</h3>
              {selectedImages.size > 0 && (
                <span className="text-sm text-muted">
                  {selectedImages.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {images.length > 0 && (
                <>
                  <button
                    onClick={selectAllImages}
                    className="text-sm text-muted hover:text-foreground transition-colors"
                  >
                    {selectedImages.size === images.length ? "Deselect All" : "Select All"}
                  </button>
                  {selectedImages.size > 0 && (
                    <button
                      onClick={deleteSelectedImages}
                      disabled={deleting}
                      className="btn !bg-error/10 !text-error hover:!bg-error hover:!text-white !w-auto !px-4 !py-2 !text-sm"
                    >
                      {deleting ? "Deleting..." : "Delete Selected"}
                    </button>
                  )}
                </>
              )}
              <button
                onClick={() => setShowUploader(true)}
                className="btn btn-primary !w-auto !px-5 !py-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Photos
              </button>
            </div>
          </div>

          {images.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-border rounded-xl">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-2">No photos yet</h4>
              <p className="text-muted text-sm mb-4">
                Upload photos to this event and let AI detect faces automatically.
              </p>
              <button
                onClick={() => setShowUploader(true)}
                className="btn btn-primary !w-auto !px-6"
              >
                Upload Photos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  onClick={() => toggleImageSelection(image.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer group ${
                    selectedImages.has(image.id) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selection Checkbox */}
                  <div
                    className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedImages.has(image.id)
                        ? "bg-primary border-primary"
                        : "border-white/70 bg-black/30 opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    {selectedImages.has(image.id) && (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>

                  {/* Face Count Badge */}
                  {image.faceCount > 0 && (
                    <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs text-white flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {image.faceCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="card border-error/20">
          <h3 className="text-lg font-semibold text-error mb-4">Danger Zone</h3>
          <p className="text-muted text-sm mb-4">
            Once you delete an event, there is no going back. All photos and participant data will be permanently removed.
          </p>
          <button
            onClick={handleDelete}
            className="btn !bg-error/10 !text-error hover:!bg-error hover:!text-white !w-auto !px-5"
          >
            Delete Event
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditEventModal
          event={event}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchEvent();
          }}
        />
      )}

      {/* Upload Modal */}
      {showUploader && (
        <BulkUploader
          eventId={eventId}
          onUploadComplete={handleUploadComplete}
          onClose={() => setShowUploader(false)}
        />
      )}
    </main>
  );
}

function EditEventModal({
  event,
  onClose,
  onSuccess,
}: {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || "");
  const [location, setLocation] = useState(event.location || "");
  const [eventDate, setEventDate] = useState(
    event.eventDate ? new Date(event.eventDate).toISOString().slice(0, 16) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Event name is required");
      return;
    }

    setLoading(true);

    const { error: apiError } = await eventsApi.update(event.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventDate: eventDate || undefined,
    });

    if (apiError) {
      setError(apiError);
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="card w-full max-w-lg animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Edit Event</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-foreground transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-error/10 border border-error/20 rounded-lg p-3 mb-6 text-error text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">Event Name *</label>
            <input
              type="text"
              placeholder="e.g., Wedding Reception"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Brief description of the event"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl p-4 text-foreground resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            <input
              type="text"
              placeholder="e.g., Grand Ballroom, Hotel XYZ"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Date</label>
            <input
              type="datetime-local"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="btn btn-primary flex-1"
            >
              {loading ? (
                <span className="animate-pulse">Saving...</span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
