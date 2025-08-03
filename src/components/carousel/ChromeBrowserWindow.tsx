import React from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor } from 'lucide-react';

interface ChromeBrowserWindowProps {
  title: string;
  url: string;
  children: React.ReactNode;
  trigger?: React.ReactNode;
}

const ChromeBrowserWindow = ({ title, url, children, trigger }: ChromeBrowserWindowProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="w-full flex items-center space-x-2">
            <Monitor className="w-4 h-4" />
            <span>See in Browser</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-card border-border">
        {/* Chrome Browser Header */}
        <div className="bg-muted border-b border-border">
          {/* Tab Bar */}
          <div className="flex items-center px-3 py-2">
            <div className="flex items-center space-x-2 flex-1">
              {/* Active Tab */}
              <div className="bg-card border border-b-0 border-border rounded-t-lg px-4 py-2 min-w-[200px] flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-sm flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
                <span className="text-sm text-foreground truncate">{title}</span>
                <div className="w-4 h-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center ml-auto">
                  <div className="w-2 h-2 text-muted-foreground">×</div>
                </div>
              </div>
              {/* Plus Button */}
              <div className="w-8 h-8 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center">
                <span className="text-muted-foreground">+</span>
              </div>
            </div>
            {/* Window Controls */}
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
          </div>
          
          {/* Address Bar */}
          <div className="px-3 pb-3">
            <div className="bg-input border border-border rounded-full px-4 py-2 flex items-center space-x-3">
              <div className="w-4 h-4 text-muted-foreground">🔒</div>
              <span className="text-sm text-muted-foreground flex-1">{url}</span>
              <div className="w-4 h-4 text-muted-foreground">⟳</div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 bg-background overflow-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChromeBrowserWindow;