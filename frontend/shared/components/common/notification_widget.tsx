'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  ScrollArea,
} from '@/shared/components/common';

const mockNotifications = [
  {
    id: 1,
    data: {
      title: 'Welcome to Grey Auctions',
      body: 'Your account has been successfully created and is ready to use.',
    },
    read_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    data: {
      title: 'System Update',
      body: 'The system will be undergoing maintenance this weekend.',
    },
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function NotificationWidget() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const hasUnreadNotifications = mockNotifications.some(
    (notification) => !notification.read_at
  );

  const handleRefresh = () => {
    console.log('Refresh notifications');
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push('/notifications');
  };

  //   const handleMarkAsRead = async (notification: NotificationItem) => {
  //     try {
  //       await markAsRead(notification.id);

  //       if (notification.navigation) {
  //         const { path, params } = notification.navigation;
  //         if (params) {
  //           const queryString = new URLSearchParams(
  //             Object.entries(params).map(([key, value]) => [key, String(value)])
  //           ).toString();
  //           router.push(`${path}?${queryString}`);
  //         } else {
  //           router.push(path);
  //         }
  //       }
  //       refetch();
  //     } catch (error) {
  //       console.error("Failed to mark notification as read:", error);
  //     }
  //   };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative rounded-lg bg-primary-4/10 border border-primary-4"
        >
          <Bell size={20} />
          {hasUnreadNotifications && (
            <span className="bg-primary-1 absolute top-2.5 right-2.5 flex size-1.5 items-center justify-center rounded-full"></span>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[250px] overflow-y-auto sm:w-[380px]"
      >
        <Card className="border-0 text-neutral-700 shadow-none">
          <CardHeader className="grid gap-1 p-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Recent Notifications{' '}
                <small className="bg-primary-2/90 rounded-full px-2 py-1 text-primary-foreground">
                  {mockNotifications.length}
                </small>
                <CardDescription>
                  <p className="font-light">
                    You have{' '}
                    <span className="font-bold">
                      {mockNotifications.filter((n) => !n.read_at).length}{' '}
                      unread
                    </span>{' '}
                    notifications
                  </p>
                </CardDescription>
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRefresh}
              >
                <span className="sr-only">Refresh notifications</span>
              </Button>
            </div>
          </CardHeader>

          <ScrollArea>
            <CardContent className="grid gap-2 p-2">
              {mockNotifications.length === 0 ? (
                <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
                  <p className="text-muted-foreground text-sm">
                    No notifications
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {mockNotifications.map((item) => (
                    <div
                      key={item.id}
                      className={`relative flex w-full gap-4 rounded-lg p-3 text-left transition-colors ${
                        !item.read_at
                          ? 'bg-muted/50 hover:bg-muted'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          !item.read_at
                            ? 'bg-primary-1 text-primary-foreground'
                            : 'bg-muted-foreground/10 text-muted-foreground'
                        }`}
                      >
                        <Bell className="h-5" />
                      </div>

                      <div className="grid gap-1">
                        <p className="text-sm leading-none font-medium capitalize">
                          {item.data?.title}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {`${item.data?.body?.substring(0, 40)}...`}
                        </p>
                        <p className="text-muted-foreground/70 text-xs">
                          {item.created_at
                            ? format(
                                new Date(item.created_at),
                                'dd/MM/yyyy h:mm a'
                              )
                            : ''}
                        </p>
                      </div>

                      {!item.read_at && (
                        <span className="bg-primary-1 absolute top-3 right-3 h-2 w-2 rounded-full" />
                      )}
                    </div>
                  ))}

                  <Button
                    className="mt-3 w-full text-xs"
                    onClick={handleViewAll}
                  >
                    View All
                  </Button>
                </div>
              )}
            </CardContent>
          </ScrollArea>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
