"use client";

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/analytics";

interface ViewContentTrackerProps {
    name: string;
    type: 'column' | 'book' | 'calculator' | 'mentor';
    id: string;
}

export function ViewContentTracker({ name, type, id }: ViewContentTrackerProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (hasTracked.current) return;
        
        trackMetaEvent('ViewContent', {
            content_name: name,
            content_type: type,
            content_ids: [id],
        });
        
        hasTracked.current = true;
    }, [name, type, id]);

    return null; // UI 없이 로직만 수행
}
