import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { QuantityControl } from '@/components/QuantityControl';

describe('QuantityControl Component', () => {
  describe('Rendering', () => {
    it('should render with correct quantity', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should render increase button with correct aria-label', () => {
      render(
        <QuantityControl
          quantity={1}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      expect(increaseButton).toBeInTheDocument();
    });

    it('should render decrease button with correct aria-label', () => {
      render(
        <QuantityControl
          quantity={1}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).toBeInTheDocument();
    });
  });

  describe('Increment/Decrement Functionality', () => {
    it('should call onIncrease when increase button is clicked', async () => {
      const user = userEvent.setup();
      const onIncrease = vi.fn();

      render(
        <QuantityControl
          quantity={1}
          onIncrease={onIncrease}
          onDecrease={vi.fn()}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      await user.click(increaseButton);

      expect(onIncrease).toHaveBeenCalledTimes(1);
    });

    it('should call onDecrease when decrease button is clicked', async () => {
      const user = userEvent.setup();
      const onDecrease = vi.fn();

      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={onDecrease}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      await user.click(decreaseButton);

      expect(onDecrease).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks on increase button', async () => {
      const user = userEvent.setup();
      const onIncrease = vi.fn();

      render(
        <QuantityControl
          quantity={1}
          onIncrease={onIncrease}
          onDecrease={vi.fn()}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      await user.click(increaseButton);
      await user.click(increaseButton);
      await user.click(increaseButton);

      expect(onIncrease).toHaveBeenCalledTimes(3);
    });
  });

  describe('Min/Max Boundary Conditions', () => {
    it('should disable decrease button when at minimum', () => {
      render(
        <QuantityControl
          quantity={1}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          min={1}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).toBeDisabled();
    });

    it('should enable decrease button when above minimum', () => {
      render(
        <QuantityControl
          quantity={2}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          min={1}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).not.toBeDisabled();
    });

    it('should disable increase button when at maximum', () => {
      render(
        <QuantityControl
          quantity={10}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          max={10}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      expect(increaseButton).toBeDisabled();
    });

    it('should enable increase button when below maximum', () => {
      render(
        <QuantityControl
          quantity={9}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          max={10}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      expect(increaseButton).not.toBeDisabled();
    });

    it('should use default max of 10 when not specified', () => {
      render(
        <QuantityControl
          quantity={10}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      expect(increaseButton).toBeDisabled();
    });

    it('should use default min of 1 when not specified', () => {
      render(
        <QuantityControl
          quantity={1}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).toBeDisabled();
    });

    it('should respect custom min value', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          min={5}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).toBeDisabled();
    });

    it('should respect custom max value', () => {
      render(
        <QuantityControl
          quantity={20}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          max={20}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      expect(increaseButton).toBeDisabled();
    });
  });

  describe('Disabled States', () => {
    it('should disable both buttons when disabled prop is true', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          disabled={true}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });

      expect(increaseButton).toBeDisabled();
      expect(decreaseButton).toBeDisabled();
    });

    it('should not call handlers when disabled', async () => {
      const user = userEvent.setup();
      const onIncrease = vi.fn();
      const onDecrease = vi.fn();

      render(
        <QuantityControl
          quantity={5}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          disabled={true}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });

      await user.click(increaseButton);
      await user.click(decreaseButton);

      expect(onIncrease).not.toHaveBeenCalled();
      expect(onDecrease).not.toHaveBeenCalled();
    });

    it('should enable buttons when disabled prop is false', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          disabled={false}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });

      expect(increaseButton).not.toBeDisabled();
      expect(decreaseButton).not.toBeDisabled();
    });
  });

  describe('Keyboard Interactions', () => {
    it('should focus increase button with Tab', async () => {
      const user = userEvent.setup();

      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      await user.tab();
      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).toHaveFocus();

      await user.tab();
      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      expect(increaseButton).toHaveFocus();
    });

    it('should trigger increase with Enter key', async () => {
      const user = userEvent.setup();
      const onIncrease = vi.fn();

      render(
        <QuantityControl
          quantity={5}
          onIncrease={onIncrease}
          onDecrease={vi.fn()}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      increaseButton.focus();
      await user.keyboard('{Enter}');

      expect(onIncrease).toHaveBeenCalledTimes(1);
    });

    it('should trigger decrease with Space key', async () => {
      const user = userEvent.setup();
      const onDecrease = vi.fn();

      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={onDecrease}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      decreaseButton.focus();
      await user.keyboard(' ');

      expect(onDecrease).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button roles', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });

    it('should have aria-labels on both buttons', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
        />
      );

      const increaseButton = screen.getByLabelText(/increase quantity/i);
      const decreaseButton = screen.getByLabelText(/decrease quantity/i);

      expect(increaseButton).toBeInTheDocument();
      expect(decreaseButton).toBeInTheDocument();
    });

    it('should communicate disabled state to screen readers', () => {
      render(
        <QuantityControl
          quantity={1}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          min={1}
        />
      );

      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });
      expect(decreaseButton).toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle quantity of 0', () => {
      render(
        <QuantityControl
          quantity={0}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          min={0}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle large quantities', () => {
      render(
        <QuantityControl
          quantity={9999}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          max={10000}
        />
      );

      expect(screen.getByText('9999')).toBeInTheDocument();
    });

    it('should disable both buttons when min equals max', () => {
      render(
        <QuantityControl
          quantity={5}
          onIncrease={vi.fn()}
          onDecrease={vi.fn()}
          min={5}
          max={5}
        />
      );

      const increaseButton = screen.getByRole('button', { name: /increase quantity/i });
      const decreaseButton = screen.getByRole('button', { name: /decrease quantity/i });

      expect(increaseButton).toBeDisabled();
      expect(decreaseButton).toBeDisabled();
    });
  });
});
