CREATE TABLE `tarotAnonymousVisitors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`visitorIdHash` varchar(64) NOT NULL,
	`profileId` int,
	`freeReadingClaimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tarotAnonymousVisitors_id` PRIMARY KEY(`id`),
	CONSTRAINT `tarotAnonymousVisitors_visitorIdHash_unique` UNIQUE(`visitorIdHash`)
);
--> statement-breakpoint
CREATE TABLE `tarotIpRateLimits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bucketKey` varchar(160) NOT NULL,
	`ipHash` varchar(64) NOT NULL,
	`requestCount` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tarotIpRateLimits_id` PRIMARY KEY(`id`),
	CONSTRAINT `tarotIpRateLimits_bucketKey_unique` UNIQUE(`bucketKey`)
);
--> statement-breakpoint
ALTER TABLE `tarotReadings` MODIFY COLUMN `status` enum('pending_email','generating','ready','consumed') NOT NULL DEFAULT 'pending_email';