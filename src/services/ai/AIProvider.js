/**
 * Base AI Provider Abstract Interface
 * Allows seamless switching between Mock/Local Provider, OpenAI, Azure OpenAI,
 * Gemini, Anthropic, or Enterprise Private LLM Gateway without altering UI or Tools.
 */

export class AIProvider {
  constructor(name = 'base_provider') {
    this.name = name;
  }

  /**
   * Generates a conversational agent completion given prompt, history, context, and available tools.
   * @param {Object} params
   * @param {string} params.prompt User message
   * @param {Array} params.history Conversation history
   * @param {Object} params.context Current ATS context (page, user, role, selected entity)
   * @param {Array} params.tools Available tool definitions
   * @param {Object} params.options Additional options (stream, temperature, etc.)
   * @returns {Promise<{ text: string, toolCalls?: Array, intent?: Object, cards?: Array }>}
   */
  async generateCompletion(params) {
    throw new Error('generateCompletion() must be implemented by concrete AIProvider.');
  }

  /**
   * Evaluates text similarity, embeddings or screening score
   */
  async evaluateScreening(candidateData, jdData) {
    throw new Error('evaluateScreening() must be implemented by concrete AIProvider.');
  }

  /**
   * Generates tailored interview questions based on JD and Candidate profile
   */
  async generateInterviewQuestions(jdData, candidateData, roundCategory) {
    throw new Error('generateInterviewQuestions() must be implemented by concrete AIProvider.');
  }
}
