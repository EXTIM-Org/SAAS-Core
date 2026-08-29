'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProject } from '@/app/actions/projects';
import {
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember
} from '@/app/actions/project-members';
import DashboardLoading from '../../../loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string;
}

interface Member {
  id: string;
  userId: string;
  projectId: string;
  role: string;
  createdAt: string;
  user: {
    id: string;
    email: string;
  }
}

export default function ProjectMembersPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('VIEWER');
  
  const [error, setError] = useState('');
  const [addError, setAddError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [projectData, membersData] = await Promise.all([
          getProject(projectId),
          getProjectMembers(projectId),
        ]);
        setProject(projectData);
        setMembers(membersData);
      } catch (e) {
        const err = e as Error;
        setError(err.message || 'Failed to fetch project members');
      } finally {
        setInitialLoading(false);
      }
    }
    fetchInitialData();
  }, [projectId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;
    setIsLoading(true);
    setAddError('');

    try {
      const res = await addProjectMember(projectId, newMemberEmail.trim(), newMemberRole as any);
      if (res.error) {
        setAddError(res.error);
        toast.error(res.error);
      } else {
        toast.success('Member added successfully');
        // Refresh members
        const membersData = await getProjectMembers(projectId);
        setMembers(membersData);
        setNewMemberEmail('');
        setNewMemberRole('VIEWER');
      }
    } catch (err: any) {
      setAddError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: string) => {
    try {
      const res = await updateProjectMemberRole(projectId, memberId, newRole as any);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Role updated successfully');
        setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      }
    } catch (err: any) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      const res = await removeProjectMember(projectId, memberId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Member removed successfully');
        setMembers(members.filter((m) => m.id !== memberId));
      }
    } catch (err: any) {
      toast.error('Failed to remove member');
    }
  };

  if (initialLoading) {
    return <DashboardLoading />;
  }

  if (error || !project) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/dashboard/projects/${projectId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">Error</h1>
        </div>
        <p className="text-destructive">{error || 'Project not found'}</p>
        <Button onClick={() => router.push(`/dashboard/projects/${projectId}`)} variant="outline">
          Back to Project
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link
              href={`/dashboard/projects/${projectId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
          </div>
          <p className="text-muted-foreground">
            Manage access to {project.name}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Member</CardTitle>
          <CardDescription>
            Add a new user to your project by their email address. They must already have an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4">
            <Input
              type="email"
              placeholder="user@example.com"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
              disabled={isLoading}
              className="max-w-sm"
              required
            />
            <div className="w-[180px]">
              <Select value={newMemberRole} onValueChange={(val) => val && setNewMemberRole(val)} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEWER">Viewer</SelectItem>
                  <SelectItem value="EDITOR">Editor</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="OWNER">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading || !newMemberEmail.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isLoading ? 'Adding...' : 'Add Member'}
            </Button>
          </form>
          {addError && (
            <p className="text-sm font-medium text-destructive mt-2">
              {addError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
          <CardDescription>
            All users with access to {project.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {members.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No members found.
              </div>
            ) : (
              <ul className="divide-y">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{member.user.email}</span>
                      <span className="text-xs text-muted-foreground">Joined {new Date(member.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-[140px]">
                        <Select 
                          value={member.role} 
                          onValueChange={(val: string | null) => val && handleUpdateRole(member.id, val)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIEWER">Viewer</SelectItem>
                            <SelectItem value="EDITOR">Editor</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="OWNER">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Remove Member"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
