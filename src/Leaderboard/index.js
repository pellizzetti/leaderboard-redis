const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis);

const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = process.env;

class Leaderboard {
  constructor() {
    this.boardName = 'ranking';
    this.client = redis.createClient(REDIS_PORT, REDIS_HOST);

    this.client.auth(REDIS_PASSWORD);

    this.client.on('error', (err) => {
      console.error(`Redis error: ${err}`);
    });
  }

  async getUserScore({ user }) {
    try {
      const score = await this.client.zscoreAsync([this.boardName, user]);

      return {
        user,
        score,
      };
    } catch (err) {
      throw err;
    }
  }

  async getUserRanking({ user }) {
    try {
      const ranking = await this.client.zrevrankAsync([this.boardName, user]);

      return {
        user,
        ranking: ranking !== null ? ranking + 1 : null,
      };
    } catch (err) {
      throw err;
    }
  }

  async getRanking() {
    try {
      const range = await this.client.zrevrangebyscoreAsync([
        this.boardName,
        '+inf',
        '-inf',
        'WITHSCORES',
        'LIMIT',
        0,
        10,
      ]);

      const ranking = new Array(range.length / 2)
        .fill()
        .map((_, i) => range.slice(i * 2, i * 2 + 2))
        .reduce((arr, val, i) => {
          const userRank = {
            ranking: i + 1,
            user: val[0],
            score: val[1],
          };

          arr.push(userRank);
          return arr;
        }, []);

      return ranking;
    } catch (err) {
      throw err;
    }
  }

  async setUserScore({ user, score }) {
    try {
      const userScore = await this.client.zincrbyAsync([this.boardName, score, user]);

      return {
        user,
        score: userScore,
      };
    } catch (err) {
      throw err;
    }
  }
}

module.exports = new Leaderboard();
