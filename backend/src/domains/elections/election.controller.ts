/**
 * Election Controller
 * Handles HTTP requests for election endpoints
 */

import { Request, Response, NextFunction } from 'express';
import ElectionService from './election.service';
import {
  createElectionSchema,
  updateElectionSchema,
  electionFiltersSchema,
} from './election.validator';
import { ValidationError } from '@/shared/types/errors';

class ElectionController {
  private electionService: ElectionService;

  constructor() {
    this.electionService = new ElectionService();
  }

  /**
   * Create new election
   * POST /api/v1/elections
   */
  create = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = createElectionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const election = await this.electionService.createElection(
        req.user.userId,
        req.user.role,
        validationResult.data
      );

      res.status(201).json({
        success: true,
        message: 'Election created successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * List all elections
   * GET /api/v1/elections
   */
  list = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate query params
      const validationResult = electionFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw new ValidationError('Invalid filter parameters');
      }

      const elections = await this.electionService.listElections(
        req.user.userId,
        req.user.role,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Elections retrieved successfully',
        data: elections,
        count: Array.isArray(elections) ? elections.length : 0,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get election by ID
   * GET /api/v1/elections/:id
   */
  getById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const election = await this.electionService.getElectionById(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: 'Election retrieved successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update election
   * PUT /api/v1/elections/:id
   */
  update = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      // Validate request body
      const validationResult = updateElectionSchema.safeParse(req.body);

      if (!validationResult.success) {
        const errors = validationResult.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        throw new ValidationError(
          `Validation failed: ${errors.map((e) => e.message).join(', ')}`
        );
      }

      const election = await this.electionService.updateElection(
        req.user.userId,
        req.user.role,
        req.params.id,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Election updated successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete election
   * DELETE /api/v1/elections/:id
   */
  delete = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const election = await this.electionService.deleteElection(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: 'Election deleted successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Approve election
   * POST /api/v1/elections/:id/approve
   */
  approve = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const election = await this.electionService.approveElection(
        req.user.userId,
        req.user.role,
        req.params.id
      );

      res.status(200).json({
        success: true,
        message: 'Election approved successfully',
        data: election,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get election statistics
   * GET /api/v1/elections/stats
   */
  getStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const stats = await this.electionService.getElectionStats(
        req.user.userId,
        req.user.role
      );

      res.status(200).json({
        success: true,
        message: 'Election statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload contestants from CSV
   * POST /api/v1/elections/:electionId/contests/:contestId/contestants/upload
   */
  uploadContestants = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { electionId, contestId } = req.params;

      // Parse CSV file
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter((line) => line.trim());

      if (lines.length <= 1) {
        throw new ValidationError('CSV file is empty or invalid');
      }

      // Parse headers
      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/"/g, ''));

      // Parse rows
      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record);
      }

      // Upload contestants
      const result = await this.electionService.uploadContestants(
        req.user.userId,
        req.user.role,
        electionId,
        contestId,
        records
      );

      res.status(200).json({
        success: true,
        message: `Upload completed: ${result.successful} successful, ${result.failed} failed`,
        data: {
          successful: result.successful,
          failed: result.failed,
          errors: result.errors,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Download contests CSV template
   * GET /api/v1/elections/contests/template
   */
  downloadContestsTemplate = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Generate CSV template with examples for all contest types
      const csvRows: string[] = [
        // Header
        'SNo,Surname,OtherNames,CountyCode,County,ConstituencyCode,ConstituencyName,CAWCode,CAWName,PartyCode,PartyName,PartyAbbreviation,ElectionType',
        // Presidential example (County code 000 for nationwide - though rare in by-elections)
        '1,Kenyatta,Uhuru Muigai,000,Kenya,,,,,015,United Democratic Alliance,UDA,Presidential',
        '2,Odinga,Raila Amolo,000,Kenya,,,,,021,Orange Democratic Movement,ODM,Presidential',
        // Gubernatorial example
        '1,Waiguru,Anne Mumbi,020,Kirinyaga,,,,,015,United Democratic Alliance,UDA,Governor',
        '2,Waweru,John Gitonga,020,Kirinyaga,,,,,021,Orange Democratic Movement,ODM,Governor',
        '3,Kamau,Mary Wanjiku,020,Kirinyaga,,,,,027,Jubilee Party,JP,Governor',
        // Senatorial example
        '1,Lelegwe,Jackson Kotol,025,Samburu,,,,,015,United Democratic Alliance,UDA,Senate',
        '2,Kotol,Julius Lelegwe,025,Samburu,,,,,021,Orange Democratic Movement,ODM,Senate',
        '3,Lemoile,Daniel Leparapo,025,Samburu,,,,,IND,Independent,IND,Senate',
        // Women's Representative example
        "1,Mutiso,Jane Wanjiku,014,Embu,,,,,015,United Democratic Alliance,UDA,Women's Representative",
        "2,Njeru,Mary Karimi,014,Embu,,,,,021,Orange Democratic Movement,ODM,Women's Representative",
        "3,Kinyua,Sarah Muthoni,014,Embu,,,,,027,Jubilee Party,JP,Women's Representative",
        // Member of Parliament example
        '1,Njoroge,Peter Kamau,047,Nairobi City,283,Embakasi North,,,015,United Democratic Alliance,UDA,National Assembly',
        '2,Kamau,James Njoroge,047,Nairobi City,283,Embakasi North,,,021,Orange Democratic Movement,ODM,National Assembly',
        '3,Ochieng,John Otieno,047,Nairobi City,283,Embakasi North,,,IND,Independent,IND,National Assembly',
        // County Assembly Ward (CAW) example
        '1,Onyango,Tom Ochieng,041,Siaya,223,Ugunja,2231,Ugunja Ward,015,United Democratic Alliance,UDA,County Assembly',
        '2,Okumu,Michael Owino,041,Siaya,223,Ugunja,2231,Ugunja Ward,021,Orange Democratic Movement,ODM,County Assembly',
        '3,Odhiambo,David Omondi,041,Siaya,223,Ugunja,2231,Ugunja Ward,IND,Independent,IND,County Assembly',
      ];

      const csvContent = csvRows.join('\n');

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="contests-template-${new Date().toISOString().split('T')[0]}.csv"`
      );
      res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

      res.status(200).send(csvContent);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload contests from CSV
   * POST /api/v1/elections/:electionId/contests/upload
   */
  uploadContests = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      if (!req.file) {
        throw new ValidationError('No file uploaded');
      }

      const { electionId } = req.params;

      // Parse CSV file
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split('\n').filter((line) => line.trim());

      if (lines.length <= 1) {
        throw new ValidationError('CSV file is empty or invalid');
      }

      // Parse headers
      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().replace(/"/g, ''));

      // Parse rows
      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
          const char = lines[i][j];

          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        const record: any = {};
        headers.forEach((header, index) => {
          record[header] = values[index] || '';
        });
        records.push(record);
      }

      // Upload contests
      const result = await this.electionService.uploadContests(
        req.user.userId,
        req.user.role,
        electionId,
        records
      );

      res.status(200).json({
        success: true,
        message: `Upload completed: ${result.contestsCreated} contests created, ${result.candidatesCreated} candidates created`,
        data: {
          contestsCreated: result.contestsCreated,
          candidatesCreated: result.candidatesCreated,
          contests: result.contests,
          errors: result.errors,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ElectionController;

