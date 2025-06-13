import React from 'react';
import { useGameContext } from '../context/GameContext';
import '../styles/Notifications.css';

const Notifications: React.FC = () => {
    const { game } = useGameContext();

    return (
        <div className="notification-area">
            <h3>Notifications</h3>
            <div className="notifications">
                {game.notifications.map((notification, index) => (
                    <div key={index} className="notification-item">
                        {notification}
                    </div>
                ))}
                {game.notifications.length === 0 && (
                    <div className="notification-item empty">
                        No notifications yet.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications; 