import { useEffect, useState } from "react";
import SpendwiseLoader from "./loader";

interface LoaderGateProps {
    children: React.ReactNode;
}

const LoaderGate: React.FC<LoaderGateProps> = ({ children }) => {
    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        const hasSeen = localStorage.getItem("spendwise_intro_seen");

        if (!hasSeen) {
            setShowLoader(true);

            const timer = setTimeout(() => {
                setShowLoader(false);
                localStorage.setItem("spendwise_intro_seen", "true");
            }, 3000); // loader duration

            return () => clearTimeout(timer);
        }
    }, []);

    if (showLoader) return <SpendwiseLoader />;

    return <>{children}</>;
};

export default LoaderGate;
