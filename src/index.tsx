import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Check, List, Shuffle, Trash2, Download, Upload, BarChart2 } from 'lucide-react';

const VERSION = '2.0.0';
const K_FACTOR = 32;
const INITIAL_RATING = 1400;

const ItemComparisonVoter = () => {
  const [items, setItems] = useState([]);
  const [currentPair, setCurrentPair] = useState([]);
  const [rankings, setRankings] = useState({});
  const [newItem, setNewItem] = useState('');
  const [comparisonsMade, setComparisonsMade] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [importExportText, setImportExportText] = useState('');
  const [useElo, setUseElo] = useState(true);
  const [sortBy, setSortBy] = useState('score');
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (items.length >= 2 && currentPair.length === 0) {
      selectNextPair();
    }
  }, [items]);

  const addItem = () => {
    if (newItem.trim() !== '') {
      setItems(prev => [...prev, newItem.trim()].sort());
      setRankings(prev => ({...prev, [newItem.trim()]: INITIAL_RATING}));
      setNewItem('');
    }
  };

  const selectNextPair = () => {
    if (items.length < 2) {
      setCurrentPair([]);
      return;
    }
    const pair = [];
    while (pair.length < 2) {
      const randomItem = items[Math.floor(Math.random() * items.length)];
      if (!pair.includes(randomItem)) {
        pair.push(randomItem);
      }
    }
    setCurrentPair(pair);
  };

  const calculateEloChange = (winnerRating, loserRating) => {
    const expectedScore = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
    return Math.round(K_FACTOR * (1 - expectedScore));
  };

  const vote = (winner) => {
    const loser = currentPair.find(item => item !== winner);
    if (useElo) {
      const winnerRating = rankings[winner];
      const loserRating = rankings[loser];
      const ratingChange = calculateEloChange(winnerRating, loserRating);
      setRankings(prev => ({
        ...prev,
        [winner]: prev[winner] + ratingChange,
        [loser]: prev[loser] - ratingChange
      }));
    } else {
      setRankings(prev => ({
        ...prev,
        [winner]: (prev[winner] || 0) + 1,
      }));
    }
    setComparisonsMade(prev => prev + 1);
    selectNextPair();
  };

  const resetVoting = () => {
    setRankings(Object.fromEntries(items.map(item => [item, INITIAL_RATING])));
    setComparisonsMade(0);
    selectNextPair();
  };

  const getSortedItems = () => {
    return [...items].sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.localeCompare(b);
      }
      return rankings[b] - rankings[a];
    });
  };

  const exportItems = () => {
    const sortedItems = [...items].sort((a, b) => a.localeCompare(b));
    setImportExportText(sortedItems.join('\n'));
  };

  const importItems = () => {
    const newItems = importExportText.split('\n')
      .map(item => item.trim())
      .filter(item => item !== '')
      .sort((a, b) => a.localeCompare(b));
    setItems(newItems);
    setRankings(Object.fromEntries(newItems.map(item => [item, INITIAL_RATING])));
    setImportExportText('');
  };

  const removeItem = (itemToRemove) => {
    setItems(prev => prev.filter(item => item !== itemToRemove));
    setRankings(prev => {
      const { [itemToRemove]: _, ...rest } = prev;
      return rest;
    });
  };

  const shuffleItems = () => {
    setItems(prev => [...prev].sort(() => Math.random() - 0.5));
  };

  const getItemStats = () => {
    const sortedItems = getSortedItems();
    const totalComparisons = comparisonsMade;
    const averageRating = items.length > 0 ?
      Object.values(rankings).reduce((sum, rating) => sum + rating, 0) / items.length : 0;

    return {
      totalItems: items.length,
      topItem: sortedItems[0],
      bottomItem: sortedItems[sortedItems.length - 1],
      totalComparisons,
      averageRating: Math.round(averageRating),
    };
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Item Comparison Voter v{VERSION}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label htmlFor="newItem">Add new item:</Label>
            <div className="flex">
              <Input
                id="newItem"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addItem()}
                className="mr-2"
              />
              <Button onClick={addItem}><Check size={16} /></Button>
            </div>
          </div>

          <div className="mb-4 flex items-center">
            <Label htmlFor="useElo" className="mr-2">Use ELO Scoring:</Label>
            <Switch id="useElo" checked={useElo} onCheckedChange={setUseElo} />
          </div>

          {currentPair.length === 2 && (
            <div className="mb-4">
              <p className="mb-2">Choose your preferred item:</p>
              <div className="flex justify-between">
                <Button onClick={() => vote(currentPair[0])} className="mr-2">{currentPair[0]}</Button>
                <Button onClick={() => vote(currentPair[1])}>{currentPair[1]}</Button>
              </div>
            </div>
          )}

          <div className="mb-4">
            <Label>Comparisons made: {comparisonsMade}</Label>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <Button onClick={resetVoting}><AlertCircle size={16} className="mr-2" /> Reset</Button>
            <Button onClick={() => setShowResults(!showResults)}>
              <List size={16} className="mr-2" /> {showResults ? 'Hide' : 'Show'} Results
            </Button>
            <Button onClick={shuffleItems}><Shuffle size={16} className="mr-2" /> Shuffle</Button>
            <Button onClick={exportItems}><Download size={16} className="mr-2" /> Export</Button>
            <Button onClick={importItems}><Upload size={16} className="mr-2" /> Import</Button>
            <Button onClick={() => setShowStats(!showStats)}>
              <BarChart2 size={16} className="mr-2" /> {showStats ? 'Hide' : 'Show'} Stats
            </Button>
          </div>

          {showStats && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Statistics:</h3>
              <ul>
                <li>Total Items: {getItemStats().totalItems}</li>
                <li>Top Item: {getItemStats().topItem} ({rankings[getItemStats().topItem]})</li>
                <li>Bottom Item: {getItemStats().bottomItem} ({rankings[getItemStats().bottomItem]})</li>
                <li>Total Comparisons: {getItemStats().totalComparisons}</li>
                <li>Average Rating: {getItemStats().averageRating}</li>
              </ul>
            </div>
          )}

          {showResults && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Current Rankings:</h3>
              <div className="mb-2">
                <Label htmlFor="sortBy" className="mr-2">Sort by:</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ol>
                {getSortedItems().map((item) => (
                  <li key={item} className="flex justify-between items-center mb-1">
                    <span>{item} (Score: {rankings[item]})</span>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(item)}>
                      <Trash2 size={16} />
                    </Button>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mb-4">
            <Label htmlFor="importExport">Import/Export Items:</Label>
            <textarea
              id="importExport"
              value={importExportText}
              onChange={(e) => setImportExportText(e.target.value)}
              className="w-full h-32 p-2 border rounded"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ItemComparisonVoter;
