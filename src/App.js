import React, { useState } from 'react';
import { Wheel } from 'react-custom-roulette';
import './App.css';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';  // Import the Alert component

const API_KEY = process.env.REACT_APP_API_KEY;
const valid_ytlink = new RegExp(
  '^(https?:\\/\\/)?(www\\.)?(youtube\\.com|youtu\\.be)\\/(watch\\?v=|embed\\/|v\\/|.+\\?v=)?([a-zA-Z0-9_-]{11})$'
);

function App() {
  const [link, setLink] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [mustSpin, setMustSpin] = useState(false);
  const [prizeNumber, setPrizeNumber] = useState(0);
  const [open, setOpen] = useState(false);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(''); // Define successMessage state

  const handleChange = (e) => {
    const value = e.target.value;
    setLink(value);
    setIsValid(valid_ytlink.test(value));
  };

  const handleSubmit = async () => {
    if (isValid && link) {
      const videoId = extractVideoId(link);
      if (videoId) {
        setLoading(true);
        setSuccessMessage(''); // Clear success message before new request

        setTimeout(async () => { // Wait for 2 seconds before starting the fetch
          await fetchComments(videoId);
          setLoading(false);
        }, 2000); // 2000ms delay (2 seconds)
      } else {
        setError('Ungültiger YouTube-Link.');
      }
    }
  };

  const extractVideoId = (url) => {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const fetchComments = async (videoId) => {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/commentThreads?key=${API_KEY}&textFormat=plainText&part=snippet&videoId=${videoId}`
      );
      const data = await response.json();

      if (data.items) {
        const uniqueNames = new Set();
        const fetchedComments = data.items
          .map((item) => {
            const author = item.snippet.topLevelComment.snippet.authorDisplayName;
            if (!uniqueNames.has(author)) {
              uniqueNames.add(author);
              return {
                author,
                comment: item.snippet.topLevelComment.snippet.textDisplay,
                profileImage: item.snippet.topLevelComment.snippet.authorProfileImageUrl,
              };
            }
            return null;
          })
          .filter((comment) => comment !== null);

        setComments(fetchedComments);
        setSuccessMessage(`Es haben ${fetchedComments.length} verschiedene Personen ein Kommentar hinterlassen.`); 
        setError('');
      } else {
        setError('Keine Kommentare gefunden oder ungültige Video-ID.');
      }
    } catch (error) {
      console.error('Fehler beim Abrufen der Kommentare:', error);
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    }
  };

  const handleSpin = () => {
    setMustSpin(true);
    setPrizeNumber(Math.floor(Math.random() * comments.length));
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="App">
      <header className="App-header">
        <div>
          <TextField
            id="standard-basic"
            label="Dein YouTube-Link"
            variant="standard"
            value={link}
            onChange={handleChange}
            error={!isValid}
            helperText={!isValid ? 'Bitte einen gültigen YouTube-Link eingeben.' : ''}
            autoComplete="off"
            
            InputProps={{
              style: { color: 'white', fontSize: '16px' },
            }}
            InputLabelProps={{
              style: { fontSize: '16px', color: 'white' },
            
            }}
            sx={{ marginBottom: '20px', width: '300px' }}
          />
        </div>
        <div style={{ marginTop: '20px' }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={!isValid || link === '' || loading}
            style={{ width: '150px' }}
          >
           {loading ? (
    <span style={{ color: 'white' }}>Lädt...</span> // White text during loading
  ) : 'Absenden'}
            {loading && <CircularProgress  size={30}  sx={{ color: 'white', }} />}
          </Button>
        </div>

        {/* Success message */}
        {successMessage && (
          <Alert severity="success" style={{ marginTop: '20px', width: '400px' }}>
            {successMessage}
          </Alert>
        )}

        {error && <p style={{ color: 'red', fontSize: '16px' }}>{error}</p>}
        {comments.length > 0 && (
          <>
            <Wheel
              mustStartSpinning={mustSpin}
              prizeNumber={prizeNumber}
              data={comments.map((comment) => ({
                option: comment.author,
                style: { textColor: 'white' },
              }))}
              backgroundColors={comments.map((_, index) => {
                const colors = ['#3e3e3e', '#df3428', '#28df34', '#3428df', '#dfdf28'];
                return colors[index % colors.length];
              })}
              textColors={['#ffffff']}
              onStopSpinning={() => {
                const winner = comments[prizeNumber];
                setWinner(winner);
                setOpen(true);
                setMustSpin(false);
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSpin}
              disabled={mustSpin}
              style={{ marginTop: '20px', height: '56px', fontSize: '16px' }}
            >
              Auslosen
            </Button>
          </>
        )}
      </header>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth={true}
        PaperProps={{ style: { width: '40%', maxWidth: 'none' } }}
      >
        <DialogTitle style={{ textAlign: 'center' }}>Der Gewinner ist!</DialogTitle>
        <DialogContent style={{ textAlign: 'center' }}>
          {winner ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src={winner.profileImage}
                  alt={winner.author}
                  style={{ width: '40px', borderRadius: '50%', marginRight: '10px' }}
                />
                <strong>{winner.author}</strong>
              </div>
              <p style={{ marginTop: '10px' }}>
                <strong>Verfaster Kommentar: </strong>{winner.comment}
              </p>
            </div>
          ) : (
            <p style={{ textAlign: 'center' }}>Bitte warten...</p>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Schließen
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;
