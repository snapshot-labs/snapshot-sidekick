CREATE TABLE moderation (
  `action` VARCHAR(256) NOT NULL,
  `type` VARCHAR(256) NOT NULL,
  `value` VARCHAR(256) NOT NULL,
  `created` INT(11) NOT NULL,
  PRIMARY KEY (`type`, `value`),
  INDEX `action` (`action`),
  INDEX `created` (`created`)
);
