import React from 'react';
import { Game } from '../models/Game';
import '../styles/Notifications.css';

interface NotificationsProps {
    game: Game;
}

const Notifications: React.FC<NotificationsProps> = ({ game }) => {
    return (
        <div className="notifications-container">
            <h3>Notifications</h3>
            <div className="notifications-list">
                {game.notifications.map((notification, index) => (
                    <div key={index} className="notification-item">
                        <span className="notification-timestamp">{notification.timestamp}</span>
                        <span className="notification-message">{notification.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications; 