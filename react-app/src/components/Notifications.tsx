import React from 'react';
import { Game } from '../models/Game';
import '../styles/Notifications.css';

interface NotificationsProps {
    game: Game;
}

const Notifications: React.FC<NotificationsProps> = ({ game }) => {
    const getNotificationIcon = (type: 'positive' | 'negative' | 'neutral') => {
        switch (type) {
            case 'positive':
                return <span className="material-icons notification-icon positive">sentiment_very_satisfied</span>;
            case 'negative':
                return <span className="material-icons notification-icon negative">sentiment_dissatisfied</span>;
            case 'neutral':
                return <span className="material-icons notification-icon neutral">info</span>;
            default:
                return null;
        }
    };

    return (
        <div className="notifications-container">
            <h3>Notifications</h3>
            <div className="notifications-list">
                {game.notifications.map((notification, index) => (
                    <div key={index} className="notification-item">
                        <span className="notification-timestamp">{notification.timestamp}</span>
                        {getNotificationIcon(notification.type)}
                        <span className="notification-message">{notification.message}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Notifications; 