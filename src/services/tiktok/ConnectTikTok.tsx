import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TikTokService } from '@/services/tiktok/TikTokService';

export function ConnectTikTok() {
    const [isLoading, setIsLoading] = useState(false);

    const handleConnect = async () => {
        try {
            setIsLoading(true);
            const tiktokService = new TikTokService();
            const authUrl = tiktokService.getAuthUrl();
            window.location.href = authUrl;
        } catch (error) {
            console.error('Failed to initiate TikTok connection:', error);
            // You might want to show an error toast here
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
                <img
                    src="/tiktok-logo.png"
                    alt="TikTok"
                    className="w-8 h-8"
                />
                <div>
                    <h3 className="font-semibold">Connect TikTok</h3>
                    <p className="text-sm text-gray-500">
                        Import your TikTok videos and analytics
                    </p>
                </div>
            </div>
            
            <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? 'Connecting...' : 'Connect TikTok Account'}
            </Button>
        </div>
    );
} 