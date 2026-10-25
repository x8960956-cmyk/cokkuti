import React, { useState, useRef } from 'react';
import { X, User as UserIcon, ShieldCheck, MapPin, Globe, Sparkles, Check, Camera, Upload } from 'lucide-react';
import { User, UserRole } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (updated: Partial<User>) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [avatarFileName, setAvatarFileName] = useState<string | null>(null);
  const [title, setTitle] = useState(user.title);
  const [bio, setBio] = useState(user.bio);
  const [role, setRole] = useState<UserRole>(user.role);
  const [location, setLocation] = useState(user.location);
  const [website, setWebsite] = useState(user.website || '');
  const [skills, setSkills] = useState(user.skills.join(', '));
  const [interests, setInterests] = useState(user.interests.join(', '));
  const [lookingForCoFounder, setLookingForCoFounder] = useState(user.lookingForCoFounder || false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const roles: UserRole[] = [
    'Founder',
    'Aspiring entrepreneur',
    'Investor',
    'Co-founder seeker',
    'Developer',
    'Designer',
    'Mentor',
    'Student',
    'Startup enthusiast',
  ];

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      avatar,
      title,
      bio,
      role,
      location,
      website,
      skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      interests: interests.split(',').map(s => s.trim()).filter(Boolean),
      lookingForCoFounder,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="bg-[#13192B] border border-[#1F293D] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Hidden File Picker */}
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarFile}
        />

        <div className="px-5 sm:px-6 py-4 border-b border-[#1F293D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Edit Founder Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto text-xs text-gray-300 flex-1">
          {/* Avatar with computer photo upload */}
          <div className="flex items-center justify-between gap-4 p-3.5 bg-[#0B0F19] rounded-2xl border border-gray-800">
            <div className="flex items-center gap-3.5">
              <div className="relative group">
                <img
                  src={avatar}
                  alt={name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-white text-sm">{name}</span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {avatarFileName ? `Uploaded: ${avatarFileName}` : 'Profile Avatar'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1.5 transition active:scale-95 whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Choose Photo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-white mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-white mb-1">Professional Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white mb-1.5">Select Your Role</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {roles.map(r => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`p-2 rounded-xl text-[11px] font-medium border text-center transition active:scale-95 ${
                    role === r
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-[#0B0F19] border-gray-800 text-gray-400 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white mb-1">Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-white mb-1">Location</label>
              <input
                type="text"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-white mb-1">Website</label>
              <input
                type="text"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-white mb-1">Skills (comma separated)</label>
            <input
              type="text"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className="w-full px-3 py-2 bg-[#0B0F19] border border-gray-800 rounded-xl text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#0B0F19] border border-gray-800">
            <input
              type="checkbox"
              id="co-founder-checkbox"
              checked={lookingForCoFounder}
              onChange={e => setLookingForCoFounder(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-0"
            />
            <label htmlFor="co-founder-checkbox" className="font-semibold text-white cursor-pointer">
              Actively seeking a co-founder for my next venture
            </label>
          </div>

          <div className="pt-3 border-t border-gray-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 text-gray-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md active:scale-95"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
