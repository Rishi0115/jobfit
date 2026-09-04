"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { updateProfileAction } from "@/actions/profile";
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Link2,
  Code2,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface ProfileEditorProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  profile: {
    bio?: string | null;
    phone?: string | null;
    location?: string | null;
    targetRole?: string | null;
    experienceLevel?: string | null;
    preferredWorkMode?: string | null;
    linkedinUrl?: string | null;
    githubUrl?: string | null;
    portfolioUrl?: string | null;
  } | null;
}

export function ProfileEditor({ user, profile }: ProfileEditorProps) {
  const [formData, setFormData] = useState({
    bio: profile?.bio || "",
    phone: profile?.phone || "",
    location: profile?.location || "",
    targetRole: profile?.targetRole || "",
    experienceLevel: profile?.experienceLevel || "",
    preferredWorkMode: profile?.preferredWorkMode || "",
    linkedinUrl: profile?.linkedinUrl || "",
    githubUrl: profile?.githubUrl || "",
    portfolioUrl: profile?.portfolioUrl || "",
  });

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await updateProfileAction({
        bio: formData.bio || null,
        phone: formData.phone || null,
        location: formData.location || null,
        targetRole: formData.targetRole || null,
        experienceLevel: (formData.experienceLevel as any) || null,
        preferredWorkMode: (formData.preferredWorkMode as any) || null,
        linkedinUrl: formData.linkedinUrl || null,
        githubUrl: formData.githubUrl || null,
        portfolioUrl: formData.portfolioUrl || null,
      });

      if (res.success) {
        setSuccessMessage("Profile updated successfully.");
      } else {
        setErrorMessage(
          typeof res.error === "string" ? res.error : "Failed to update profile."
        );
      }
    } catch {
      setErrorMessage("An unexpected error occurred while saving profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-sm">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 text-red-800 border border-red-200 text-sm">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Account Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary-600" />
              Account Details
            </CardTitle>
            <Badge variant="outline" className="capitalize">
              {user.role.toLowerCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Full Name</Label>
              <Input value={user.name} disabled className="bg-gray-50 mt-1.5" />
            </div>
            <div>
              <Label>Email Address</Label>
              <Input value={user.email} disabled className="bg-gray-50 mt-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Career Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-primary-600" />
            Career Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="targetRole">Target Role</Label>
              <Input
                id="targetRole"
                placeholder="e.g. Full Stack Engineer"
                value={formData.targetRole}
                onChange={(e) =>
                  setFormData({ ...formData, targetRole: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="experienceLevel">Experience Level</Label>
              <select
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={(e) =>
                  setFormData({ ...formData, experienceLevel: e.target.value })
                }
                className="w-full mt-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select level...</option>
                <option value="FRESHER">Fresher (0-1 yrs)</option>
                <option value="JUNIOR">Junior (1-3 yrs)</option>
                <option value="MID">Mid-level (3-5 yrs)</option>
                <option value="SENIOR">Senior (5+ yrs)</option>
                <option value="LEAD">Lead / Principal</option>
              </select>
            </div>

            <div>
              <Label htmlFor="preferredWorkMode">Preferred Work Mode</Label>
              <select
                id="preferredWorkMode"
                value={formData.preferredWorkMode}
                onChange={(e) =>
                  setFormData({ ...formData, preferredWorkMode: e.target.value })
                }
                className="w-full mt-1.5 h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select work mode...</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">On-site</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Professional Bio</Label>
            <Textarea
              id="bio"
              rows={3}
              placeholder="Brief summary of your engineering background, key technical interests, and achievements..."
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="mt-1.5 resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contact & Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary-600" />
            Contact & Social Profiles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location" className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" /> Location
              </Label>
              <Input
                id="location"
                placeholder="e.g. Bengaluru, India"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-gray-400" /> Phone
              </Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="linkedinUrl" className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-gray-400" /> LinkedIn URL
              </Label>
              <Input
                id="linkedinUrl"
                placeholder="https://linkedin.com/in/username"
                value={formData.linkedinUrl}
                onChange={(e) =>
                  setFormData({ ...formData, linkedinUrl: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="githubUrl" className="flex items-center gap-1.5">
                <Code2 className="h-3.5 w-3.5 text-gray-400" /> GitHub URL
              </Label>
              <Input
                id="githubUrl"
                placeholder="https://github.com/username"
                value={formData.githubUrl}
                onChange={(e) =>
                  setFormData({ ...formData, githubUrl: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="portfolioUrl" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-gray-400" /> Portfolio Website
            </Label>
            <Input
              id="portfolioUrl"
              placeholder="https://yourportfolio.dev"
              value={formData.portfolioUrl}
              onChange={(e) =>
                setFormData({ ...formData, portfolioUrl: e.target.value })
              }
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" isLoading={loading} rightIcon={<Save className="h-4 w-4" />}>
          Save Profile
        </Button>
      </div>
    </form>
  );
}
